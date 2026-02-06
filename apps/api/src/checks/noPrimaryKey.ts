import type { Pool } from 'pg';

export type NoPrimaryKeyRow = { schema: string; table: string };

export async function checkNoPrimaryKey(
  pool: Pool,
  schemas: string[],
): Promise<{ violations: NoPrimaryKeyRow[] }> {
  const res = await pool.query<NoPrimaryKeyRow>(
    `
    WITH tbl AS (
      SELECT c.oid, n.nspname AS schema, c.relname AS table
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname = ANY($1::text[])
    ),
    pk AS (
      SELECT conrelid
      FROM pg_constraint
      WHERE contype = 'p'
    )
    SELECT t.schema, t.table
    FROM tbl t
    LEFT JOIN pk ON pk.conrelid = t.oid
    WHERE pk.conrelid IS NULL
    ORDER BY t.schema, t.table;
    `,
    [schemas],
  );

  return { violations: res.rows };
}
