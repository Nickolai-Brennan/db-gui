import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { runChecklist } from "../checklist/runner";
import { query } from "../sql";

const UUIDSchema = z.string().uuid();

export async function instancesRoutes(app: FastifyInstance) {
  // Create new instance
  app.post("/api/v1/workspaces/:wsId/checklist-instances", async (req) => {
    const wsId = UUIDSchema.parse((req.params as any).wsId);

    const Body = z.object({
      connectionId: z.string().uuid().optional(),
      templateVersionId: z.string().uuid(),
      scopeType: z.enum(["diagram", "schema", "table", "migration_step"]),
      scopeRef: z.any(),
      createdBy: z.string().optional(),
    });
    const body = Body.parse(req.body);

    // For backwards compatibility, try both v2 and v1 tables
    let rows = [];
    try {
      rows = await query<any>(
        `
        INSERT INTO checklist_instances_v2 (workspace_id, connection_id, template_version_id, scope_type, scope_ref, status, created_by)
        VALUES ($1, $2, $3, $4, $5, 'incomplete', $6)
        RETURNING *
        `,
        [
          wsId,
          body.connectionId || null,
          body.templateVersionId,
          body.scopeType,
          JSON.stringify(body.scopeRef),
          body.createdBy || null,
        ]
      );
    } catch {
      // Fallback to v1 table if v2 doesn't exist
      rows = await query<any>(
        `
        INSERT INTO checklist_instances (connection_id, template_version_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING *
        `,
        [body.connectionId || null, body.templateVersionId]
      );
    }

    return { instance: rows[0] };
  });

  // Get instance summary
  app.get("/api/v1/checklist-instances/:instanceId", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    let rows = [];
    try {
      rows = await query<any>(
        `
        SELECT *
        FROM checklist_instances_v2
        WHERE id = $1
        `,
        [instanceId]
      );
    } catch {
      rows = await query<any>(
        `
        SELECT *
        FROM checklist_instances
        WHERE id = $1
        `,
        [instanceId]
      );
    }

    return { instance: rows[0] || null };
  });

  // Get instance tree with results
  app.get("/api/v1/checklist-instances/:instanceId/tree", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    // Get instance to find template version
    let instance;
    try {
      const instanceRows = await query<any>(
        `
        SELECT template_version_id
        FROM checklist_instances_v2
        WHERE id = $1
        `,
        [instanceId]
      );
      instance = instanceRows[0];
    } catch {
      const instanceRows = await query<any>(
        `
        SELECT template_version_id
        FROM checklist_instances
        WHERE id = $1
        `,
        [instanceId]
      );
      instance = instanceRows[0];
    }

    if (!instance) {
      return { error: "Instance not found", tree: [] };
    }

    // Get nodes
    let nodes = [];
    try {
      nodes = await query<any>(
        `
        SELECT *
        FROM checklist_nodes_v2
        WHERE template_version_id = $1
        ORDER BY sort_order ASC
        `,
        [instance.template_version_id]
      );
    } catch {
      nodes = await query<any>(
        `
        SELECT *
        FROM checklist_nodes
        WHERE version_id = $1
        ORDER BY ordinal ASC
        `,
        [instance.template_version_id]
      );
    }

    // Get results
    let results = [];
    try {
      results = await query<any>(
        `
        SELECT node_id, status, severity, target_ref, ran_at, output_summary
        FROM checklist_instance_results_v2
        WHERE instance_id = $1
        `,
        [instanceId]
      );
    } catch {
      results = await query<any>(
        `
        SELECT node_id, status, output
        FROM checklist_instance_results
        WHERE instance_id = $1
        `,
        [instanceId]
      );
    }

    const resultsByNode = new Map(results.map((r: any) => [r.node_id, r]));

    // Build tree with results attached
    const buildResultTree = (parentId: string | null): any[] => {
      return nodes
        .filter((n: any) => n.parent_id === parentId)
        .map((n: any) => ({
          ...n,
          result: resultsByNode.get(n.id) || null,
          children: buildResultTree(n.id),
        }));
    };

    const tree = buildResultTree(null);
    return { tree };
  });

  // Get issues list
  app.get("/api/v1/checklist-instances/:instanceId/issues", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    let rows = [];
    try {
      rows = await query<any>(
        `
        SELECT 
          r.id,
          r.severity,
          n.title,
          n.description,
          n.scope_type as target_kind,
          r.target_ref,
          r.output_summary,
          r.ran_at
        FROM checklist_instance_results_v2 r
        JOIN checklist_nodes_v2 n ON n.id = r.node_id
        WHERE r.instance_id = $1
          AND r.status IN ('warning', 'fail', 'blocked')
        ORDER BY 
          CASE r.severity 
            WHEN 'blocking' THEN 1
            WHEN 'error' THEN 2
            WHEN 'warning' THEN 3
            ELSE 4
          END,
          r.ran_at DESC
        `,
        [instanceId]
      );
    } catch {
      rows = await query<any>(
        `
        SELECT 
          r.id,
          n.severity,
          n.label as title,
          n.description,
          r.output
        FROM checklist_instance_results r
        JOIN checklist_nodes n ON n.id = r.node_id
        WHERE r.instance_id = $1
          AND r.status IN ('warning', 'fail')
        ORDER BY n.severity DESC
        `,
        [instanceId]
      );
    }

    return { issues: rows };
  });

  // Update instance result
  app.patch("/api/v1/checklist-instance-results/:resultId", async (req) => {
    const resultId = UUIDSchema.parse((req.params as any).resultId);

    const Body = z.object({
      status: z.enum(["unchecked", "pass", "warning", "fail", "blocked"]).optional(),
      note: z.string().optional(),
      checkedBy: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(body.status);
    }
    if (body.note !== undefined) {
      updates.push(`note = $${idx++}`);
      values.push(body.note);
    }
    if (body.checkedBy !== undefined) {
      updates.push(`checked_by = $${idx++}`);
      values.push(body.checkedBy);
    }

    updates.push(`updated_at = now()`);

    if (updates.length === 1) {
      // Only updated_at
      return { result: null };
    }

    values.push(resultId);

    let rows = [];
    try {
      rows = await query<any>(
        `
        UPDATE checklist_instance_results_v2
        SET ${updates.join(", ")}
        WHERE id = $${idx}
        RETURNING *
        `,
        values
      );
    } catch {
      rows = await query<any>(
        `
        UPDATE checklist_instance_results
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [body.status, resultId]
      );
    }

    return { result: rows[0] || null };
  });

  // Run checks
  app.post("/api/v1/checklist-instances/:instanceId/run", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      schemas: z.array(z.string().min(1)).min(1),
      mode: z.enum(["all", "items"]).default("all"),
      nodeIds: z.array(z.string().uuid()).optional(),
    });

    const body = Body.parse(req.body);

    const result = await runChecklist({
      instanceId,
      targetDatabaseUrl: body.targetDatabaseUrl,
      schemas: body.schemas,
      mode: body.mode,
      nodeIds: body.nodeIds,
    });

    return result;
  });

  // Get ERD layout
  app.get("/api/v1/checklist-instances/:instanceId/erd-layout", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    const rows = await query<any>(
      `
      SELECT layout
      FROM erd_layouts
      WHERE instance_id = $1
      `,
      [instanceId]
    );

    return { layout: rows[0]?.layout || {} };
  });

  // Save ERD layout
  app.put("/api/v1/checklist-instances/:instanceId/erd-layout", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    const Body = z.object({
      layout: z.record(z.any()),
    });
    const body = Body.parse(req.body);

    await query(
      `
      INSERT INTO erd_layouts (instance_id, layout, updated_at)
      VALUES ($1, $2, now())
      ON CONFLICT (instance_id)
      DO UPDATE SET layout = $2, updated_at = now()
      `,
      [instanceId, JSON.stringify(body.layout)]
    );

    return { success: true };
  });
}
