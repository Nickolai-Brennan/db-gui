import type { Pool } from "pg";

export type FkNotIndexedRow = {
  fk_name: string;
  child_schema: string;
  child_table: string;
  child_cols: string[];
};

export async function checkFkNotIndexed(
  pool: Pool,
  schemas: string[]
): Promise<{ violations: FkNotIndexedRow[] }> {
  const res = await pool.query<FkNotIndexedRow>(
    `
    WITH fk AS (
      SELECT
        con.oid AS con_oid,
        con.conname AS fk_name,
        c_child.oid AS child_oid,
        n_child.nspname AS child_schema,
        c_child.relname AS child_table,
        con.conkey AS child_attnums
      FROM pg_constraint con
      JOIN pg_class c_child ON c_child.oid = con.conrelid
      JOIN pg_namespace n_child ON n_child.oid = c_child.relnamespace
      WHERE con.contype='f'
        AND n_child.nspname = ANY($1::text[])
    ),
    fk_cols AS (
      SELECT
        fk.con_oid,
        fk.fk_name,
        fk.child_oid,
        fk.child_schema,
        fk.child_table,
        array_agg(a.attname ORDER BY x.ord) AS child_cols,
        fk.child_attnums AS child_attnums
      FROM fk
      JOIN LATERAL unnest(fk.child_attnums) WITH ORDINALITY AS x(attnum, ord) ON true
      JOIN pg_attribute a ON a.attrelid = fk.child_oid AND a.attnum = x.attnum
      GROUP BY fk.con_oid, fk.fk_name, fk.child_oid, fk.child_schema, fk.child_table, fk.child_attnums
    ),
    idx AS (
      SELECT
        i.indrelid AS child_oid,
        i.indkey::int[] AS indkey
      FROM pg_index i
      WHERE i.indisvalid = true AND i.indisready = true
    ),
    matches AS (
      SELECT
        fk_cols.con_oid,
        EXISTS (
          SELECT 1
          FROM idx
          WHERE idx.child_oid = fk_cols.child_oid
            AND idx.indkey[1:array_length(fk_cols.child_attnums,1)] = fk_cols.child_attnums
        ) AS has_index
      FROM fk_cols
    )
    SELECT
      fk_cols.fk_name,
      fk_cols.child_schema,
      fk_cols.child_table,
      fk_cols.child_cols
    FROM fk_cols
    JOIN matches ON matches.con_oid = fk_cols.con_oid
    WHERE matches.has_index = false
    ORDER BY fk_cols.child_schema, fk_cols.child_table, fk_cols.fk_name;
    `,
    [schemas]
  );

  return { violations: res.rows };
}
