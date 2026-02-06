export const qTables = `
SELECT
  n.nspname AS schema,
  c.relname AS name,
  c.oid     AS oid,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned_table'
    ELSE 'table'
  END       AS kind,
  c.reltuples::bigint AS row_estimate,

  pg_total_relation_size(c.oid)::bigint AS total_bytes,
  pg_relation_size(c.oid)::bigint AS table_bytes,
  pg_indexes_size(c.oid)::bigint AS index_bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = ANY($1::text[])
  AND c.relkind IN ('r','p')
ORDER BY n.nspname, c.relname;
`;

export const qColumns = `
SELECT
  n.nspname AS schema,
  c.relname AS table,
  a.attname AS name,
  a.attnum  AS ordinal,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  NOT a.attnotnull AS is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid) AS default_expr,
  a.attidentity IN ('a','d') AS is_identity
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
WHERE n.nspname = ANY($1::text[])
  AND c.relkind IN ('r','p')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY n.nspname, c.relname, a.attnum;
`;

export const qPrimaryKeys = `
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS name,
  array_agg(a.attname ORDER BY x.ord) AS columns
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = x.attnum
WHERE n.nspname = ANY($1::text[])
  AND con.contype = 'p'
GROUP BY n.nspname, c.relname, con.conname
ORDER BY n.nspname, c.relname, con.conname;
`;

export const qUniqueConstraints = `
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS name,
  con.contype = 'p' AS is_primary,
  array_agg(a.attname ORDER BY x.ord) AS columns
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = x.attnum
WHERE n.nspname = ANY($1::text[])
  AND con.contype IN ('u','p')
GROUP BY n.nspname, c.relname, con.conname, con.contype
ORDER BY n.nspname, c.relname, con.contype, con.conname;
`;

export const qForeignKeys = `
SELECT
  con.conname AS name,
  n_child.nspname AS child_schema,
  c_child.relname AS child_table,
  array_agg(a_child.attname ORDER BY x.ord) AS child_cols,

  n_parent.nspname AS parent_schema,
  c_parent.relname AS parent_table,
  array_agg(a_parent.attname ORDER BY x.ord) AS parent_cols,

  con.confdeltype AS on_delete_code,
  con.confupdtype AS on_update_code,
  con.condeferrable AS deferrable,
  con.condeferred  AS initially_deferred
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
GROUP BY
  con.conname,
  n_child.nspname, c_child.relname,
  n_parent.nspname, c_parent.relname,
  con.confdeltype, con.confupdtype,
  con.condeferrable, con.condeferred
ORDER BY n_child.nspname, c_child.relname, con.conname;
`;

export const qIndexes = `
SELECT
  n.nspname AS schema,
  c.relname AS table,
  ic.relname AS name,
  am.amname  AS method,
  i.indisunique AS is_unique,
  i.indisprimary AS is_primary,
  i.indisvalid AS is_valid,
  pg_get_expr(i.indpred, i.indrelid) AS predicate,
  pg_get_indexdef(i.indexrelid) AS definition,

  array_remove(array_agg(a.attname ORDER BY x.ord), NULL) AS columns
FROM pg_index i
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_class ic ON ic.oid = i.indexrelid
JOIN pg_am am ON am.oid = ic.relam
LEFT JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS x(attnum, ord) ON true
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = x.attnum
WHERE n.nspname = ANY($1::text[])
  AND c.relkind IN ('r','p')
GROUP BY
  n.nspname, c.relname, ic.relname, am.amname,
  i.indisunique, i.indisprimary, i.indisvalid, i.indpred, i.indrelid, i.indexrelid
ORDER BY n.nspname, c.relname, ic.relname;
`;
