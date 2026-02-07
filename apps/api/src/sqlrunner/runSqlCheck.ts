/**
 * SQL Check Executor
 * Main execution wrapper for SQL-based checks
 */

import type { Pool, PoolClient } from 'pg';
import type { CheckResult } from './types';
import { interpolateTemplate } from './interpolate';
import { enforceLimits, setStatementTimeout } from './limits';
import { mapRowsToTargets } from './mapping';
import { evaluateResult } from './evaluate';

interface ChecklistNode {
  id: string;
  sql_template?: string;
  result_mapping?: any;
  pass_fail_rule?: any;
  severity: string;
}

export async function runSqlCheck(
  targetPool: Pool,
  node: ChecklistNode,
  vars: Record<string, any>
): Promise<CheckResult> {
  const startMs = Date.now();
  
  if (!node.sql_template) {
    throw new Error('SQL template is required for SQL checks');
  }
  
  // Interpolate template
  const sql = interpolateTemplate(node.sql_template, vars);
  
  // Apply limits
  const safeSql = enforceLimits(sql, {
    rowCap: 100,
    timeoutMs: 2500,
  });
  
  // Execute with timeout
  const client: PoolClient = await targetPool.connect();
  try {
    await setStatementTimeout(client, 2500);
    const result = await client.query(safeSql);
    
    // Map results to targets
    const targets = node.result_mapping 
      ? mapRowsToTargets(result.rows, node.result_mapping)
      : [];
    
    // Evaluate pass/fail
    const status = evaluateResult(result.rows.length, node.pass_fail_rule);
    
    return {
      status,
      severity: node.severity,
      targets,
      outputRows: result.rows.slice(0, 25),
      outputStats: { rowCount: result.rows.length },
      durationMs: Date.now() - startMs,
    };
  } finally {
    client.release();
  }
}
