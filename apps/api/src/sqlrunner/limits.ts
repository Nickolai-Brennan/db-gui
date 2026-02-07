// SQL execution with timeout and row cap enforcement

import type { Pool } from 'pg';

export async function executeWithLimits(
  pool: Pool,
  sql: string,
  opts: { timeoutMs: number; rowCap: number }
): Promise<{ rows: any[]; fields: any[]; duration: number }> {
  const start = Date.now();
  
  // Set statement timeout per session
  await pool.query(`SET statement_timeout = ${opts.timeoutMs}`);
  
  try {
    const result = await pool.query(sql);
    const duration = Date.now() - start;
    
    return {
      rows: result.rows.slice(0, opts.rowCap),
      fields: result.fields,
      duration,
    };
  } finally {
    await pool.query('RESET statement_timeout');
  }
}
