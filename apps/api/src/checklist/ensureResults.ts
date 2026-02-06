import { query } from "../sql";
import type { UUID } from "../types";

export async function ensureInstanceResults(instanceId: UUID): Promise<void> {
  await query(
    `
    INSERT INTO checklist_instance_results (instance_id, node_id, status, severity, run_type)
    SELECT 
      $1::uuid,
      n.id,
      'unchecked',
      COALESCE(n.severity, 'info'),
      CASE 
        WHEN n.check_code IS NOT NULL THEN 'automatic'
        ELSE 'manual'
      END
    FROM checklist_instances i
    JOIN checklist_nodes n ON n.version_id = i.template_version_id
    WHERE i.id = $1
      AND n.node_type = 'check'
      AND NOT EXISTS (
        SELECT 1 FROM checklist_instance_results r
        WHERE r.instance_id = i.id AND r.node_id = n.id
      )
    ON CONFLICT (instance_id, node_id) DO NOTHING
    `,
    [instanceId]
  );
}
