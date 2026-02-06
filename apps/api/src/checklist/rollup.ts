import { query, queryOne } from '../sql';
import type { UUID } from '../types';

type RollupCounts = {
  totalItems: number;
  blockedCount: number;
  failCount: number;
  warningCount: number;
  passCount: number;
  uncheckedCount: number;
};

export async function recomputeInstanceRollup(instanceId: UUID): Promise<RollupCounts> {
  const stats = await queryOne<any>(
    `
    SELECT
      COUNT(*) AS total_items,
      COUNT(*) FILTER (WHERE status = 'blocked') AS blocked_count,
      COUNT(*) FILTER (WHERE status = 'fail') AS fail_count,
      COUNT(*) FILTER (WHERE status = 'warning') AS warning_count,
      COUNT(*) FILTER (WHERE status = 'pass') AS pass_count,
      COUNT(*) FILTER (WHERE status = 'unchecked') AS unchecked_count
    FROM checklist_instance_results
    WHERE instance_id = $1
    `,
    [instanceId]
  );

  const rollupStatus = 
    stats.blocked_count > 0 ? 'blocked' :
    stats.fail_count > 0 ? 'fail' :
    stats.warning_count > 0 ? 'warning' :
    stats.unchecked_count > 0 ? 'incomplete' :
    'pass';

  await query(
    `
    UPDATE checklist_instances
    SET
      status = $2,
      last_run_at = now()
    WHERE id = $1
    `,
    [instanceId, rollupStatus]
  );

  return {
    totalItems: Number(stats.total_items),
    blockedCount: Number(stats.blocked_count),
    failCount: Number(stats.fail_count),
    warningCount: Number(stats.warning_count),
    passCount: Number(stats.pass_count),
    uncheckedCount: Number(stats.unchecked_count),
  };
}
