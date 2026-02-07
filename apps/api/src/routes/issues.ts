import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../sql";

const UUIDSchema = z.string().uuid();

export async function issuesRoutes(app: FastifyInstance) {
  app.get("/api/v1/checklist-instances/:instanceId/issues", async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);
    
    const Query = z.object({
      severity: z.string().optional(), // comma-separated: "blocking,error"
      schema: z.string().optional(),
      nodeId: z.string().uuid().optional(), // filter by subtree
      status: z.string().optional(), // "fail,blocked,warning"
    });
    
    const queryParams = Query.parse(req.query);
    
    // Build section path using recursive CTE
    const sqlQuery = `
      WITH RECURSIVE section_path AS (
        SELECT
          id, parent_id, title, node_type,
          ARRAY[title] as path
        FROM checklist_nodes_v2
        WHERE parent_id IS NULL AND template_version_id = (
          SELECT template_version_id FROM checklist_instances_v2 WHERE id = $1
        )
        
        UNION ALL
        
        SELECT
          cn.id, cn.parent_id, cn.title, cn.node_type,
          sp.path || cn.title
        FROM checklist_nodes_v2 cn
        JOIN section_path sp ON cn.parent_id = sp.id
      )
      SELECT
        r.id as result_id,
        r.status,
        r.severity,
        n.title,
        n.check_ref as code,
        r.target_ref,
        r.output_summary,
        sp.path as section_path
      FROM checklist_instance_results_v2 r
      JOIN checklist_nodes_v2 n ON r.node_id = n.id
      JOIN section_path sp ON n.id = sp.id
      WHERE r.instance_id = $1
        AND r.status IN ('fail', 'blocked', 'warning')
        ${queryParams.severity ? `AND r.severity = ANY($2::text[])` : ''}
        ${queryParams.status ? `AND r.status = ANY($${queryParams.severity ? '3' : '2'}::text[])` : ''}
      ORDER BY
        CASE r.severity
          WHEN 'blocking' THEN 1
          WHEN 'error' THEN 2
          WHEN 'warning' THEN 3
          ELSE 4
        END,
        sp.path
    `;
    
    const params: any[] = [instanceId];
    if (queryParams.severity) params.push(queryParams.severity.split(','));
    if (queryParams.status) params.push(queryParams.status.split(','));
    
    const result = await query<any>(sqlQuery, params);
    
    // Filter by schema if provided
    let issues = result.map(row => ({
      resultId: row.result_id,
      severity: row.severity,
      status: row.status,
      code: row.code,
      title: row.title,
      sectionPath: row.section_path,
      targetRef: row.target_ref?.targets?.[0] || null,
      outputSummary: row.output_summary,
    }));
    
    if (queryParams.schema) {
      issues = issues.filter(issue => 
        issue.targetRef?.schema === queryParams.schema
      );
    }
    
    // Filter by nodeId subtree if provided
    if (queryParams.nodeId) {
      // Get all descendant node IDs
      const descendants = await query<any>(
        `
        WITH RECURSIVE subtree AS (
          SELECT id FROM checklist_nodes_v2 WHERE id = $1
          UNION ALL
          SELECT n.id FROM checklist_nodes_v2 n
          JOIN subtree s ON n.parent_id = s.id
        )
        SELECT id FROM subtree
        `,
        [queryParams.nodeId]
      );
      
      const nodeIds = new Set(descendants.map(d => d.id));
      issues = issues.filter(issue => {
        // Find the node_id for this result
        const resultNode = result.find(r => r.result_id === issue.resultId);
        return resultNode && nodeIds.has(resultNode.node_id);
      });
    }
    
    return { issues };
  });
}
