import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../sql";

const UUIDSchema = z.string().uuid();

export async function issuesRoutes(app: FastifyInstance) {
  app.get("/api/v1/checklist-instances/:instanceId/issues", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);
    
    const Query = z.object({
      severity: z.string().optional(),
      status: z.string().optional(),
      schema: z.string().optional(),
      nodeId: z.string().uuid().optional(),
    });
    const queryParams = Query.parse(req.query);
    
    const filters: string[] = ['r.instance_id = $1'];
    const values: any[] = [instanceId];
    let idx = 2;
    
    if (queryParams.severity) {
      filters.push(`r.severity = ANY($${idx++}::text[])`);
      values.push(queryParams.severity.split(','));
    }
    
    if (queryParams.status) {
      filters.push(`r.status = ANY($${idx++}::text[])`);
      values.push(queryParams.status.split(','));
    }
    
    if (queryParams.schema) {
      filters.push(`r.target_ref->>'schema' = $${idx++}`);
      values.push(queryParams.schema);
    }
    
    if (queryParams.nodeId) {
      filters.push(`r.node_id = $${idx++}`);
      values.push(queryParams.nodeId);
    }
    
    const rows = await query<any>(
      `
      WITH RECURSIVE section_path AS (
        SELECT id, parent_id, title, ARRAY[title] as path
        FROM checklist_nodes_v2
        WHERE template_version_id = (
          SELECT template_version_id FROM checklist_instances_v2 WHERE id = $1
        ) AND parent_id IS NULL
        
        UNION ALL
        
        SELECT n.id, n.parent_id, n.title, sp.path || n.title
        FROM checklist_nodes_v2 n
        JOIN section_path sp ON n.parent_id = sp.id
      )
      SELECT 
        r.id as result_id,
        r.status,
        r.severity,
        n.title as item_title,
        n.check_ref as code,
        r.target_ref,
        r.output_summary,
        r.ran_at,
        sp.path as section_path
      FROM checklist_instance_results_v2 r
      JOIN checklist_nodes_v2 n ON r.node_id = n.id
      LEFT JOIN section_path sp ON n.id = sp.id
      WHERE ${filters.join(' AND ')}
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
      values
    );
    
    return { issues: rows };
  });
}
