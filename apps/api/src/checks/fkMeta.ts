import type { Pool } from 'pg';

export type FkMeta = {
  fk_name: string;
  child_schema: string;
  child_table: string;
  child_cols: string[];
  parent_schema: string;
  parent_table: string;
  parent_cols: string[];
};

export async function getForeignKeys(pool: Pool, schemas: string[]): Promise<FkMeta[]> {
  const res = await pool.query<FkMeta>(
    `
    SELECT
      con.conname AS fk_name,
      n_child.nspname AS child_schema,
      c_child.relname AS child_table,
      array_agg(a_child.attname ORDER BY x.ord) AS child_cols,
      n_parent.nspname AS parent_schema,
      c_parent.relname AS parent_table,
      array_agg(a_parent.attname ORDER BY x.ord) AS parent_cols
    FROM pg_constraint con
    JOIN pg_class c_child ON c_child.oid = con.conrelid
    JOIN pg_namespace n_child ON n_child.oid = c_child.relnamespace
    JOIN pg_class c_parent ON c_parent.oid = con.confrelid
    JOIN pg_namespace n_parent ON n_parent.oid = c_parent.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord) ON true
    JOIN pg_attribute a_child ON a_child.attrelid = c_child.oid AND a_child.attnum = x.attnum
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS y(attnum, ord) ON y.ord = x.ord
    JOIN pg_attribute a_parent ON a_parent.attrelid = c_parent.oid AND a_parent.attnum = y.attnum
    WHERE con.contype = 'f'
      AND n_child.nspname = ANY($1::text[])
    GROUP BY con.conname, n_child.nspname, c_child.relname, n_parent.nspname, c_parent.relname
    ORDER BY n_child.nspname, c_child.relname, con.conname;
    `,
    [schemas],
  );

  return res.rows;
}
