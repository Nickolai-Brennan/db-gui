## ERD Spec v1 — Part 3 (Postgres introspection SQL + migration examples + FK selector patterns)

This is the “engineering meat”: the exact SQL you run against Postgres to power **ERD + schema builder + data entry**.

---

# 1) Postgres Introspection SQL (v1 Contract)

### Inputs

* `:schemas` = array of schema names you include (e.g. `['public','stats']`)
* Optional: `:include_views` boolean

---

## 1.1 List tables (and basic stats)

```sql
-- Tables (and estimated row count + size)
SELECT
  n.nspname                          AS schema,
  c.relname                          AS table,
  c.oid                              AS table_oid,
  c.relkind                          AS relkind, -- 'r' table, 'p' partitioned table
  pg_total_relation_size(c.oid)      AS total_bytes,
  pg_relation_size(c.oid)            AS heap_bytes,
  COALESCE(s.n_live_tup, 0)::bigint  AS est_rows,
  s.last_analyze,
  s.last_autoanalyze
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_all_tables s ON s.relid = c.oid
WHERE n.nspname = ANY(:schemas)
  AND c.relkind IN ('r','p')
ORDER BY n.nspname, c.relname;
```

---

## 1.2 Columns (type, nullability, defaults, identity)

```sql
SELECT
  n.nspname                      AS schema,
  c.relname                      AS table,
  c.oid                          AS table_oid,
  a.attnum                       AS ordinal_position,
  a.attname                      AS column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  NOT a.attnotnull               AS is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid) AS default_expression,
  a.attidentity                  AS identity,  -- '' | 'a' | 'd'
  a.attgenerated                 AS generated  -- '' | 's'
FROM pg_attribute a
JOIN pg_class c      ON c.oid = a.attrelid
JOIN pg_namespace n  ON n.oid = c.relnamespace
LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
WHERE n.nspname = ANY(:schemas)
  AND c.relkind IN ('r','p')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY n.nspname, c.relname, a.attnum;
```

---

## 1.3 Primary keys + unique constraints

```sql
SELECT
  n.nspname                    AS schema,
  c.relname                    AS table,
  con.oid                      AS constraint_oid,
  con.conname                  AS constraint_name,
  con.contype                  AS constraint_type, -- 'p' pk, 'u' unique
  ARRAY_AGG(a.attname ORDER BY u.ord) AS columns
FROM pg_constraint con
JOIN pg_class c      ON c.oid = con.conrelid
JOIN pg_namespace n  ON n.oid = c.relnamespace
JOIN LATERAL UNNEST(con.conkey) WITH ORDINALITY AS u(attnum, ord) ON TRUE
JOIN pg_attribute a  ON a.attrelid = c.oid AND a.attnum = u.attnum
WHERE n.nspname = ANY(:schemas)
  AND con.contype IN ('p','u')
GROUP BY n.nspname, c.relname, con.oid, con.conname, con.contype
ORDER BY n.nspname, c.relname, con.contype DESC, con.conname;
```

---

## 1.4 Foreign keys (with rules + deferrable)

This powers ERD edges + cardinality (nullable FK → optional relationship).

```sql
SELECT
  child_n.nspname              AS child_schema,
  child_c.relname              AS child_table,
  con.conname                  AS fk_name,

  parent_n.nspname             AS parent_schema,
  parent_c.relname             AS parent_table,

  ARRAY_AGG(child_a.attname ORDER BY u.ord)  AS child_columns,
  ARRAY_AGG(parent_a.attname ORDER BY u.ord) AS parent_columns,

  con.confdeltype              AS on_delete_code, -- a,r,c,n,d
  con.confupdtype              AS on_update_code, -- a,r,c,n,d

  con.condeferrable            AS deferrable,
  con.condeferred              AS initially_deferred
FROM pg_constraint con
JOIN pg_class child_c     ON child_c.oid = con.conrelid
JOIN pg_namespace child_n ON child_n.oid = child_c.relnamespace
JOIN pg_class parent_c    ON parent_c.oid = con.confrelid
JOIN pg_namespace parent_n ON parent_n.oid = parent_c.relnamespace

JOIN LATERAL UNNEST(con.conkey)  WITH ORDINALITY AS u(attnum, ord) ON TRUE
JOIN LATERAL UNNEST(con.confkey) WITH ORDINALITY AS v(attnum, ord) ON v.ord = u.ord

JOIN pg_attribute child_a  ON child_a.attrelid = child_c.oid  AND child_a.attnum  = u.attnum
JOIN pg_attribute parent_a ON parent_a.attrelid = parent_c.oid AND parent_a.attnum = v.attnum

WHERE con.contype = 'f'
  AND child_n.nspname = ANY(:schemas)
  AND parent_n.nspname = ANY(:schemas)
GROUP BY
  child_n.nspname, child_c.relname, con.conname,
  parent_n.nspname, parent_c.relname,
  con.confdeltype, con.confupdtype, con.condeferrable, con.condeferred
ORDER BY child_schema, child_table, fk_name;
```

Map rule codes to UI strings:

* `c` CASCADE
* `r` RESTRICT
* `n` SET NULL
* `d` SET DEFAULT
* `a` NO ACTION

---

## 1.5 Indexes (including partial + method)

```sql
SELECT
  n.nspname AS schema,
  c.relname AS table,
  ic.relname AS index_name,
  am.amname AS index_method,
  i.indisunique AS is_unique,
  i.indisprimary AS is_primary,
  pg_get_indexdef(i.indexrelid) AS index_ddl,
  pg_get_expr(i.indpred, i.indrelid) AS predicate
FROM pg_index i
JOIN pg_class c      ON c.oid = i.indrelid
JOIN pg_namespace n  ON n.oid = c.relnamespace
JOIN pg_class ic     ON ic.oid = i.indexrelid
JOIN pg_am am        ON am.oid = ic.relam
WHERE n.nspname = ANY(:schemas)
ORDER BY n.nspname, c.relname, ic.relname;
```

If you also want **index columns** (for structured editor), parse `pg_get_indexdef` or use `pg_attribute` + `i.indkey` with `unnest` similarly.

---

## 1.6 Views (+ definition)

```sql
SELECT
  n.nspname AS schema,
  c.relname AS view,
  c.oid     AS view_oid,
  pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = ANY(:schemas)
  AND c.relkind IN ('v','m')  -- v=view, m=materialized view
ORDER BY n.nspname, c.relname;
```

---

# 2) Migration SQL Generation Examples (Visual edits → SQL)

## 2.1 Create table (+ pk + fk + index)

Example: user creates `stats.player` and `stats.game`, and FK `game.player_id → player.id`.

```sql
-- 1) Create player
CREATE TABLE stats.player (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  bats        text,
  throws      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) Create game
CREATE TABLE stats.game (
  id          bigserial PRIMARY KEY,
  player_id   bigint NOT NULL,
  game_date   date NOT NULL,
  team        text,
  opp         text
);

-- 3) Add FK (separate step = safer ordering)
ALTER TABLE stats.game
  ADD CONSTRAINT game_player_id_fkey
  FOREIGN KEY (player_id)
  REFERENCES stats.player(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- 4) Add index for FK (recommended)
CREATE INDEX game_player_id_idx ON stats.game(player_id);

-- 5) Common analytic index (example)
CREATE INDEX game_game_date_idx ON stats.game(game_date);
```

**ERD rule:** whenever you add an FK, the tool should *recommend* an index on the FK column(s).

---

## 2.2 Add column (safe additive change)

```sql
ALTER TABLE stats.player
  ADD COLUMN mlbam_id integer;
```

## 2.3 Change nullability (potentially unsafe if data violates)

Your tool should run a pre-check:

* `SELECT COUNT(*) WHERE col IS NULL`
  Then apply:

```sql
ALTER TABLE stats.player
  ALTER COLUMN name SET NOT NULL;
```

## 2.4 Rename column (unsafe unless confirmed)

Postgres supports rename:

```sql
ALTER TABLE stats.player RENAME COLUMN throws TO throw_hand;
```

But your diff engine should only do this if the user explicitly confirmed the rename.

---

# 3) Data Entry Patterns (FK-aware forms + fast selectors)

This is the big UX differentiator: **human-friendly relational editing**.

## 3.1 Base “grid” query (paginated)

Use keyset pagination if you can; offset is fine for v1.

**Offset v1:**

```sql
SELECT *
FROM stats.player
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
```

**Keyset (better):**

```sql
SELECT *
FROM stats.player
WHERE (:cursor_id IS NULL OR id < :cursor_id)
ORDER BY id DESC
LIMIT :limit;
```

## 3.2 “Record form” query (single row by PK)

```sql
SELECT *
FROM stats.player
WHERE id = :id;
```

## 3.3 Child records panel (one-to-many)

When viewing a player, show related games:

```sql
SELECT *
FROM stats.game
WHERE player_id = :player_id
ORDER BY game_date DESC, id DESC
LIMIT 200;
```

## 3.4 FK selector query (searchable dropdown)

Goal: show friendly labels, not IDs.

### Step A: choose a display label

Rule:

* if column `name` exists → use it
* else first text/varchar column
* else fallback to PK text

### Step B: query

```sql
SELECT
  p.id,
  p.name
FROM stats.player p
WHERE (:q IS NULL OR p.name ILIKE '%' || :q || '%')
ORDER BY p.name
LIMIT 50;
```

### Step C: caching

Cache FK selector results per table:

* key: `(table, display_col, q_prefix)` for snappy UX

## 3.5 Insert/update patterns (safe parameterized)

**Insert:**

```sql
INSERT INTO stats.game (player_id, game_date, team, opp)
VALUES (:player_id, :game_date, :team, :opp)
RETURNING *;
```

**Update:**

```sql
UPDATE stats.game
SET
  player_id = :player_id,
  game_date = :game_date,
  team      = :team,
  opp       = :opp
WHERE id = :id
RETURNING *;
```

**Delete (confirm + soft-delete recommended):**

```sql
DELETE FROM stats.game
WHERE id = :id;
```

## 3.6 “Inline child add” (auto-link)

When user is on `player(id=123)` and adds a `game`, the UI should auto-fill:

* `player_id = 123`
  and only ask for the remaining fields.

---

# 4) Optional (but very worth it): Integrity pre-checks

Before adding an FK constraint, run:

```sql
SELECT COUNT(*) AS violating_rows
FROM stats.game g
LEFT JOIN stats.player p ON p.id = g.player_id
WHERE g.player_id IS NOT NULL
  AND p.id IS NULL;
```

If `violating_rows > 0`, show:

* “Cannot add FK until these rows are fixed”
* Offer actions:

  * set offending values to NULL
  * delete rows
  * map to valid IDs (bulk edit)

---

# 5) What this enables in the ERD UI (directly)

With the above queries you can:

* Draw ERD nodes/edges accurately
* Detect optional vs required relationships (nullable FK)
* Flag “missing FK indexes”
* Drive relational data entry (parent → children panels)
* Produce safe migrations with previews

---

If you want the next continuation, I can write **Part 4**:

* the exact “missing index for FK” detection rule
* ERD cardinality inference rules (based on unique constraints + nullability)
* Postgres “apply migration safely” transaction strategy (lock time + statement ordering)
* performance tactics (virtualization + catalog caching + incremental refresh)
