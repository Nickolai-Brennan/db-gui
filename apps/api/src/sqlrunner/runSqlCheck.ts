// Main SQL check executor that ties everything together

import type { Pool } from 'pg';
import { interpolateSql } from './interpolate';
import { validateReadOnly } from './readonly';
import { executeWithLimits } from './limits';
import { mapRowsToTargets } from './mapping';
import type { TargetRef } from './mapping';

export type SqlCheckResult = {
  status: 'pass' | 'fail' | 'warning' | 'blocked';
  rowCount: number;
  targets: TargetRef[];
  outputRows: any[];
  duration: number;
  error?: string;
};

export async function runSqlCheck(
  targetPool: Pool,
  node: {
    sql_template: string;
    result_mapping: any;
    pass_fail_rule: any;
    severity: string;
  },
  vars: any
): Promise<SqlCheckResult> {
  try {
    // 1. Interpolate template
    const sql = interpolateSql(node.sql_template, vars);
    
    // 2. Validate read-only
    validateReadOnly(sql);
    
    // 3. Execute with limits
    const { rows, duration } = await executeWithLimits(targetPool, sql, {
      timeoutMs: 5000,
      rowCap: 100,
    });
    
    // 4. Map to targets
    const targets = node.result_mapping
      ? mapRowsToTargets(rows, node.result_mapping)
      : [];
    
    // 5. Evaluate pass/fail
    const status = evaluateStatus(rows.length, node.pass_fail_rule, node.severity);
    
    return {
      status,
      rowCount: rows.length,
      targets,
      outputRows: rows.slice(0, 25), // store sample
      duration,
    };
  } catch (error: any) {
    return {
      status: 'blocked',
      rowCount: 0,
      targets: [],
      outputRows: [],
      duration: 0,
      error: error.message,
    };
  }
}

function evaluateStatus(
  rowCount: number,
  rule: any,
  severity: string
): 'pass' | 'fail' | 'warning' | 'blocked' {
  // Default rule: 0 rows = pass, >0 rows = fail/warn/blocked based on severity
  const hasIssues = rule?.expectZero !== false ? rowCount > 0 : rowCount === 0;
  
  if (!hasIssues) return 'pass';
  
  if (severity === 'blocking') return 'blocked';
  if (severity === 'warning') return 'warning';
  return 'fail';
}
