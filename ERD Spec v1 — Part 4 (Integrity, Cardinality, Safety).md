## ERD Spec v1 — Part 4 (Integrity, Cardinality, Safety)

This is the layer that makes the ERD **trustworthy**: correct relationship semantics, performance guardrails, and “Apply changes” safety.

---

# 1) Cardinality Inference Rules (Postgres)

You infer relationship cardinality from **FK nullability** + **uniqueness on child FK columns**.

### Inputs you already have

* FK definition (child cols → parent cols)
* Child column nullability (from columns introspection)
* Unique constraints + unique indexes on child table (from PK/unique/index introspection)

### 1.1 Optional vs Required

* **Required relationship** if **all child FK columns are NOT NULL**
* **Optional relationship** if **any child FK column is NULLABLE**

**UI mapping**

* Required: `1..N` (or `1..1`) on child side
* Optional: `0..N` (or `0..1`) on child side

### 1.2 One-to-many vs One-to-one

Let FK child column set = `C = (c1, c2, ...)`

* If `C` is covered by a **UNIQUE constraint/index** on the child table ⇒ **one-to-one** (or optional one-to-one)
* Else ⇒ **one-to-many**

**Rule**

* `parent → child` is:

  * `1—N` if child FK is non-unique
  * `1—1` if child FK is unique
  * Optional variants depend on nullability

### 1.3 Many-to-many detection (join table heuristic)

A table `t` is likely a join table if:

* It has **exactly two** outbound FKs to two different parent tables
* And either:

  * PK = (fk1_cols + fk2_cols) **OR**
  * Unique constraint exists on (fk1_cols + fk2_cols)
* And it has few/no other “payload” columns (configurable, e.g. <= 2)

**UI**

* Mark as “Join table” badge
* Offer “Collapse into M:N” visualization (optional v1.5)

---

# 2) “Missing FK Index” Detection (Performance Guardrail)

Postgres doesn’t automatically index FK columns. Your tool should warn if child FK columns are not indexed.

### 2.1 Definition: FK is “indexed” if

There exists an index on the child table where:

* The **leading columns** of the index match the FK columns in order
* Index can be non-unique (fine)
* Partial indexes count **only if** predicate does not exclude typical rows (v1: treat partial as “maybe indexed”)

### 2.2 Implementation approach (v1 pragmatic)

For each FK:

1. Get child FK columns array `C`
2. For each index DDL string (`pg_get_indexdef`):

   * parse out indexed column list (simple parser)
   * check if it starts with `C`

**Warning**

* `FK_NOT_INDEXED` → show badge on edge and child table

**Auto-fix action**

* “Create index on FK” (generates `CREATE INDEX ... ON child(fk_cols)`)

---

# 3) Integrity Checks & Warnings (ERD-level)

These are the warnings shown on tables/edges and in the Validation panel.

## 3.1 Table warnings

* `NO_PRIMARY_KEY`
* `DUPLICATE_COLUMN_NAMES`
* `RESERVED_KEYWORD_IDENTIFIER`
* `UNSUPPORTED_TYPE` (if your visual editor can’t represent it)
* `WIDE_TABLE` (e.g. > 80 cols) → performance/UX warning (optional)

## 3.2 Relationship warnings

* `FK_REFERENCES_NON_UNIQUE_PARENT`
  (parent referenced columns must be PK/unique)
* `FK_HAS_VIOLATIONS` (if data violates FK)
* `FK_NOT_INDEXED` (performance)
* `RISKY_CASCADE` (CASCADE on delete on high-degree relationships)

### 3.3 FK violation pre-check SQL (repeatable)

```sql
-- returns count of violating rows for a single FK
SELECT COUNT(*) AS violating_rows
FROM child_schema.child_table c
LEFT JOIN parent_schema.parent_table p
  ON (p.parent_col1 = c.child_col1 AND p.parent_col2 = c.child_col2)
WHERE (c.child_col1 IS NOT NULL OR c.child_col2 IS NOT NULL) -- adjust for composite
  AND (p.parent_col1 IS NULL); -- any parent col null implies no match
```

In UI:

* Show “X violating rows”
* Provide remediation actions (set null / delete / map)

---

# 4) Safe Migration “Apply” Strategy (Postgres)

## 4.1 Principles

* Prefer **additive, low-lock operations** first
* Avoid long transactions that lock big tables
* Always preview SQL and risk level
* Enforce “Safe Mode” (default)

## 4.2 Step ordering (recommended)

When applying a migration plan:

1. **CREATE TABLE** (new tables)
2. **ADD COLUMN** (nullable columns first)
3. **Backfill / data fixes** (optional, user-provided)
4. **SET NOT NULL** (only after checks pass)
5. **CREATE INDEX** (use `CONCURRENTLY` when possible)
6. **ADD FK constraints** (after violations check)
7. **ADD UNIQUE constraints** (after duplicates check)

### Index concurrently rule (Postgres)

* `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block.
  So:
* Split apply into phases:

  * Phase A: transactional DDL
  * Phase B: concurrent indexes outside transaction
  * Phase C: constraints after indexes

## 4.3 “Pre-flight” checks before APPLY

For each planned step, run checks:

### NOT NULL precheck

```sql
SELECT COUNT(*) AS nulls
FROM schema.table
WHERE col IS NULL;
```

### UNIQUE precheck

```sql
SELECT col1, col2, COUNT(*) AS n
FROM schema.table
GROUP BY col1, col2
HAVING COUNT(*) > 1
LIMIT 50;
```

### FK precheck (violations)

(see above)

If any check fails:

* Block APPLY
* Provide “Fix options” panel

---

# 5) Risk Scoring (what the UI shows)

Each migration plan gets:

* `risk: low | medium | high`
* reasons list

### Low risk

* create table
* add nullable column
* add non-unique index concurrently
* add FK after clean check

### Medium risk

* set NOT NULL
* add UNIQUE
* add FK on large table (rowcount threshold)
* create index non-concurrently

### High risk

* drop/rename columns
* change type
* drop table
* cascade delete rules on core entities

**v1 rule:** High-risk operations only allowed when “Unsafe Mode” is enabled per workspace.

---

# 6) Visual Warning System (ERD rendering)

## 6.1 Where warnings appear

* Table node header: small badge count (e.g. `⚠ 2`)
* Relationship edge: inline warning dot
* Validation panel: list grouped by severity

## 6.2 Click-to-fix behavior

* Clicking a warning:

  * zooms to table/edge
  * opens inspector at relevant tab
  * shows suggested fix (and SQL preview)

---

# 7) Apply UX (the “confidence moment”)

### Apply flow

1. “Apply” opens a side sheet:

   * Summary
   * Risk level
   * Steps list (toggle to expand SQL)
2. “Run preflight checks”
3. If clean:

   * “Apply changes” enabled
4. After apply:

   * Refresh catalog snapshot
   * Reconcile ERD (keep layout)

### Logging

Persist:

* who applied
* when
* migration SQL
* preflight results
* execution errors

Even if single-user v1, keep this structure.

---

## Next (Part 5)

If you want to close the ERD v1 spec fully, Part 5 will cover:

* Large schema performance (1000+ tables)
* Canvas virtualization + edge routing strategy
* Catalog caching + incremental refresh
* v1 cutline + v1.5 roadmap

Say **“Part 5”** and I’ll finish the spec.
