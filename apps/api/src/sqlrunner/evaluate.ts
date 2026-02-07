/**
 * Pass/Fail Evaluation
 * Evaluate check results based on pass/fail rules
 */

import type { PassFailRule, ResultStatus } from './types';

export function evaluateResult(
  rowCount: number,
  rule?: PassFailRule
): ResultStatus {
  if (!rule || rule.type === 'rows_returned') {
    const threshold = rule?.failIfGt ?? 0;
    return rowCount > threshold ? 'fail' : 'pass';
  }
  
  // Add other rule types as needed
  return 'pass';
}
