import { pool } from './db';
import type { QueryResult, QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result: QueryResult<T> = await pool.query(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T> {
  const rows = await query<T>(text, params);
  if (rows.length === 0) {
    throw new Error('Expected one row, got zero');
  }
  return rows[0]!;
}

export async function queryOptional<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0]! : null;
}
