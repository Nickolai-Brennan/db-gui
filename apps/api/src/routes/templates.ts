import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../sql";

const UUIDSchema = z.string().uuid();

export async function templatesRoutes(app: FastifyInstance) {
  // List templates for a workspace
  app.get("/api/v1/workspaces/:wsId/checklist-templates", async (req) => {
    const wsId = UUIDSchema.parse((req.params as any).wsId);

    const rows = await query<any>(
      `
      SELECT id, slug, title, description, is_system, created_at
      FROM checklist_templates_v2
      WHERE workspace_id = $1
      ORDER BY is_system DESC, title ASC
      `,
      [wsId]
    );

    return { templates: rows };
  });

  // Create new template
  app.post("/api/v1/workspaces/:wsId/checklist-templates", async (req) => {
    const wsId = UUIDSchema.parse((req.params as any).wsId);

    const Body = z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const rows = await query<any>(
      `
      INSERT INTO checklist_templates_v2 (workspace_id, slug, title, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [wsId, body.slug, body.title, body.description || null]
    );

    return { template: rows[0] };
  });

  // Update template metadata
  app.patch("/api/v1/checklist-templates/:templateId", async (req) => {
    const templateId = UUIDSchema.parse((req.params as any).templateId);

    const Body = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
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

    if (updates.length === 0) {
      return { template: null };
    }

    values.push(templateId);
    const rows = await query<any>(
      `
      UPDATE checklist_templates_v2
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      values
    );

    return { template: rows[0] || null };
  });

  // Create new version
  app.post("/api/v1/checklist-templates/:templateId/versions", async (req) => {
    const templateId = UUIDSchema.parse((req.params as any).templateId);

    const Body = z.object({
      version: z.string().min(1),
      createdBy: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const rows = await query<any>(
      `
      INSERT INTO checklist_template_versions_v2 (template_id, version, status, created_by)
      VALUES ($1, $2, 'draft', $3)
      RETURNING *
      `,
      [templateId, body.version, body.createdBy || null]
    );

    return { version: rows[0] };
  });

  // Publish a version
  app.post("/api/v1/checklist-template-versions/:versionId/publish", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);

    const rows = await query<any>(
      `
      UPDATE checklist_template_versions_v2
      SET status = 'published', published_at = now()
      WHERE id = $1 AND status = 'draft'
      RETURNING *
      `,
      [versionId]
    );

    if (rows.length === 0) {
      return { error: "Version not found or already published", version: null };
    }

    return { version: rows[0] };
  });
}
