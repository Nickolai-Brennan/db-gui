import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../sql";
import { buildTree } from "../checklist/tree";

const UUIDSchema = z.string().uuid();

export async function nodesRoutes(app: FastifyInstance) {
  // Get nodes tree for a template version
  app.get("/api/v1/checklist-template-versions/:versionId/nodes/tree", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);

    const rows = await query<any>(
      `
      SELECT *
      FROM checklist_nodes_v2
      WHERE template_version_id = $1
      ORDER BY sort_order ASC
      `,
      [versionId]
    );

    const tree = buildTree(rows);
    return { tree };
  });

  // Create new node
  app.post("/api/v1/checklist-template-versions/:versionId/nodes", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);

    const Body = z.object({
      parentId: z.string().uuid().optional(),
      nodeType: z.enum(["group", "item"]),
      title: z.string().min(1),
      description: z.string().optional(),
      sortOrder: z.number().int().default(0),
      // Item-specific fields
      itemType: z.enum(["manual", "automatic", "hybrid"]).optional(),
      severity: z.enum(["info", "warning", "error", "blocking"]).optional(),
      blocksAction: z.boolean().optional(),
      required: z.boolean().optional(),
      scopeType: z
        .enum(["diagram", "schema", "table", "column", "relationship", "migration_step"])
        .optional(),
      targetSelector: z.any().optional(),
      checkKind: z.string().optional(),
      checkRef: z.string().optional(),
      sqlTemplate: z.string().optional(),
      resultMapping: z.any().optional(),
      passFailRule: z.any().optional(),
      fixKind: z.enum(["none", "manual", "auto_sql"]).optional(),
      fixInstructions: z.string().optional(),
      fixSqlTemplate: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const rows = await query<any>(
      `
      INSERT INTO checklist_nodes_v2 (
        template_version_id, parent_id, node_type, title, description, sort_order,
        item_type, severity, blocks_action, required, scope_type, target_selector,
        check_kind, check_ref, sql_template, result_mapping, pass_fail_rule,
        fix_kind, fix_instructions, fix_sql_template
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
      `,
      [
        versionId,
        body.parentId || null,
        body.nodeType,
        body.title,
        body.description || null,
        body.sortOrder,
        body.itemType || null,
        body.severity || null,
        body.blocksAction || null,
        body.required || null,
        body.scopeType || null,
        body.targetSelector ? JSON.stringify(body.targetSelector) : null,
        body.checkKind || null,
        body.checkRef || null,
        body.sqlTemplate || null,
        body.resultMapping ? JSON.stringify(body.resultMapping) : null,
        body.passFailRule ? JSON.stringify(body.passFailRule) : null,
        body.fixKind || null,
        body.fixInstructions || null,
        body.fixSqlTemplate || null,
      ]
    );

    return { node: rows[0] };
  });

  // Update node
  app.patch("/api/v1/checklist-nodes/:nodeId", async (req) => {
    const nodeId = UUIDSchema.parse((req.params as any).nodeId);

    const Body = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      sortOrder: z.number().int().optional(),
      itemType: z.enum(["manual", "automatic", "hybrid"]).optional(),
      severity: z.enum(["info", "warning", "error", "blocking"]).optional(),
      blocksAction: z.boolean().optional(),
      required: z.boolean().optional(),
      scopeType: z
        .enum(["diagram", "schema", "table", "column", "relationship", "migration_step"])
        .optional(),
      targetSelector: z.any().optional(),
      checkKind: z.string().optional(),
      checkRef: z.string().optional(),
      sqlTemplate: z.string().optional(),
      resultMapping: z.any().optional(),
      passFailRule: z.any().optional(),
      fixKind: z.enum(["none", "manual", "auto_sql"]).optional(),
      fixInstructions: z.string().optional(),
      fixSqlTemplate: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.sortOrder !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      values.push(body.sortOrder);
    }
    if (body.itemType !== undefined) {
      updates.push(`item_type = $${idx++}`);
      values.push(body.itemType);
    }
    if (body.severity !== undefined) {
      updates.push(`severity = $${idx++}`);
      values.push(body.severity);
    }
    if (body.blocksAction !== undefined) {
      updates.push(`blocks_action = $${idx++}`);
      values.push(body.blocksAction);
    }
    if (body.required !== undefined) {
      updates.push(`required = $${idx++}`);
      values.push(body.required);
    }
    if (body.scopeType !== undefined) {
      updates.push(`scope_type = $${idx++}`);
      values.push(body.scopeType);
    }
    if (body.targetSelector !== undefined) {
      updates.push(`target_selector = $${idx++}`);
      values.push(JSON.stringify(body.targetSelector));
    }
    if (body.checkKind !== undefined) {
      updates.push(`check_kind = $${idx++}`);
      values.push(body.checkKind);
    }
    if (body.checkRef !== undefined) {
      updates.push(`check_ref = $${idx++}`);
      values.push(body.checkRef);
    }
    if (body.sqlTemplate !== undefined) {
      updates.push(`sql_template = $${idx++}`);
      values.push(body.sqlTemplate);
    }
    if (body.resultMapping !== undefined) {
      updates.push(`result_mapping = $${idx++}`);
      values.push(JSON.stringify(body.resultMapping));
    }
    if (body.passFailRule !== undefined) {
      updates.push(`pass_fail_rule = $${idx++}`);
      values.push(JSON.stringify(body.passFailRule));
    }
    if (body.fixKind !== undefined) {
      updates.push(`fix_kind = $${idx++}`);
      values.push(body.fixKind);
    }
    if (body.fixInstructions !== undefined) {
      updates.push(`fix_instructions = $${idx++}`);
      values.push(body.fixInstructions);
    }
    if (body.fixSqlTemplate !== undefined) {
      updates.push(`fix_sql_template = $${idx++}`);
      values.push(body.fixSqlTemplate);
    }

    if (updates.length === 0) {
      return { node: null };
    }

    values.push(nodeId);
    const rows = await query<any>(
      `
      UPDATE checklist_nodes_v2
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      values
    );

    return { node: rows[0] || null };
  });

  // Delete node
  app.delete("/api/v1/checklist-nodes/:nodeId", async (req) => {
    const nodeId = UUIDSchema.parse((req.params as any).nodeId);

    await query(
      `
      DELETE FROM checklist_nodes_v2
      WHERE id = $1
      `,
      [nodeId]
    );

    return { success: true };
  });

  // Batch reorder nodes
  app.post("/api/v1/checklist-template-versions/:versionId/nodes/reorder", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);

    const Body = z.object({
      orders: z.array(
        z.object({
          nodeId: z.string().uuid(),
          sortOrder: z.number().int(),
        })
      ),
    });
    const body = Body.parse(req.body);

    // Update each node's sort order
    for (const { nodeId, sortOrder } of body.orders) {
      await query(
        `
        UPDATE checklist_nodes_v2
        SET sort_order = $1
        WHERE id = $2 AND template_version_id = $3
        `,
        [sortOrder, nodeId, versionId]
      );
    }

    return { success: true };
  });
}
