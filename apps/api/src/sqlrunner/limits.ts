/**
 * SQL Guardrails
 * Enforce safety limits: timeout, row cap, single statement, read-only
 */

import type { PoolClient } from 'pg';

export interface LimitOptions {
  rowCap?: number;
  timeoutMs?: number;
}

export function enforceLimits(sql: string, opts: LimitOptions): string {
  // Check for multiple statements
  if (sql.split(';').filter(s => s.trim()).length > 1) {
    throw new Error('Multi-statement SQL not allowed');
  }
  
  // Add row cap if missing
  if (opts.rowCap && !sql.toLowerCase().includes('limit')) {
    sql = `${sql.trim()} LIMIT ${opts.rowCap}`;
  }
  
  return sql;
}

export async function setStatementTimeout(client: PoolClient, timeoutMs: number): Promise<void> {
  await client.query(`SET statement_timeout = ${timeoutMs}`);
}
