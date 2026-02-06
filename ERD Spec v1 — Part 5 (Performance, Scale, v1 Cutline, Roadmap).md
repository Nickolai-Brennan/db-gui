## ERD Spec v1 — Part 5 (Performance, Scale, v1 Cutline, Roadmap)

This is the “ship it” layer: how the ERD stays fast on huge schemas, how metadata stays fresh without hammering DBs, and what’s in/out for v1.

---

# 1) Performance Targets (what “fast” means)

### v1 targets

* **Cold load (catalog fetch + initial render)**: < 5s for ~200 tables
* **Interactive pan/zoom**: 60fps
* **Select table (inspector update)**: < 100ms
* **Search jump**: < 150ms
* **Auto-layout**: < 2s for 150 tables (progressive for more)

### Scale tiers to design for

* Small: 20–100 tables
* Medium: 100–400
* Large: 400–1500 (must degrade gracefully)

---

# 2) Canvas Rendering Strategy (critical)

## 2.1 Rendering stack

* **Nodes** (tables) should be DOM/React components (for crisp text + accessibility)
* **Edges** (relationships) should be a single canvas/WebGL layer (for speed)

**Reason:** edges dominate draw calls at scale.

## 2.2 Node virtualization (must-have)

Only render:

* nodes within viewport (+ margin buffer)
* and only visible columns inside a node

### Implementation rules

* Node body column list: virtualize rows (e.g. 20 visible at a time)
* Collapse nodes by default in large schemas:

  * show header + PK/FK badges only
  * expand on click

## 2.3 Edge virtualization (must-have)

* Only draw edges where at least one endpoint node is visible
* In “overview” zoomed-out states:

  * draw simplified straight edges (no orthogonal routing)
  * hide labels
* On zoom-in:

  * enable orthogonal routing and labels

## 2.4 Level-of-detail (LOD) rules

Based on zoom:

* **Zoom < 0.55**: node = header only, no columns
* **0.55–0.9**: show PK/FK columns only
* **> 0.9**: show all columns (virtualized)

---

# 3) Edge Routing Strategy (avoid layout hell)

## 3.1 Default routing

* Straight lines by default (fast)
* Orthogonal routing only on:

  * selected edge
  * hover edge
  * “focus path” mode
  * export render (optional)

This avoids expensive routing on every frame.

## 3.2 Crossing management

* Don’t attempt perfect crossing avoidance at v1
* Use:

  * subtle “bridge” indicator on crossings (optional)
  * hover isolate: dim all but the hovered relationship path

## 3.3 Path highlight (fast UX win)

When hovering a node:

* highlight inbound/outbound edges
* dim others

No recomputation beyond drawing style changes.

---

# 4) Auto Layout at Scale (progressive + safe)

## 4.1 Layout modes

* Cluster by schema (fast)
* Cluster by communities (medium)
* Full graph layout (slow) — optional

## 4.2 Progressive layout

For large graphs:

1. Place schema clusters (bounding boxes)
2. Layout each cluster independently
3. Route inter-cluster edges simply

## 4.3 “Don’t destroy my work” rule

Auto-layout is:

* **opt-in**
* and runs as a command (undoable)
* and has “apply to selected only”

---

# 5) Catalog Caching & Incremental Refresh

## 5.1 Catalog snapshot cache (required)

Store per connection:

* last snapshot
* hash/signature of schema objects
* last refreshed time

UI should load instantly from cache, then refresh.

## 5.2 Refresh modes

* **Refresh visible**: only load metadata for tables currently on canvas (fast)
* **Refresh schema**: reload all metadata for included schemas
* **Refresh everything**: full rebuild

## 5.3 Detecting drift cheaply

Use lightweight checks before full introspection:

* query counts/updated timestamps:

  * `pg_stat_all_tables` for analyze times
  * optionally compare `pg_class.relfilenode` changes (not perfect)
    Pragmatic v1 approach:
* refresh on demand + periodic timer (e.g. every 10–30 minutes) when connected

---

# 6) Multi-Connection / Multi-Schema Strategy

## v1 rule

* One diagram = one connection (simplifies identity + apply)
* Diagram can include multiple schemas from that connection

## v1.5

* Multi-connection diagram overlay (read-only), but migrations remain per-connection

---

# 7) v1 Cutline (what ships, what doesn’t)

## ✅ v1 MUST ship

### ERD

* Generate ERD from Postgres schemas (tables + PK + FK)
* Manual layout: move/resize, groups, notes
* Relationship creation (drag or wizard)
* Inspector: columns, keys, relationships, SQL preview
* Search (tables/columns) + jump
* Validation panel (PK missing, FK broken, FK not indexed)

### Schema builder

* Create table
* Add column
* Set PK
* Add FK (+ precheck)
* Create index
* Apply flow with preflight checks
* Safe mode default

### Data entry

* Table grid (paged)
* Record form
* Child records tabs (1-N)
* FK selector dropdown/search + “open referenced record”

### Foundation

* Undo/redo for diagram edits
* Layout persistence
* Catalog caching (load fast)

---

## ❌ Explicitly OUT of v1 (to avoid scope creep)

* Full rename inference without confirmation
* Column type changes with automatic backfill
* Partitioning UI
* Stored procedure editor
* Role/permission editor
* Collaboration / multi-user cursors
* Git-style branching of schema
* Full lineage tracking
* “Low-code app builder”
* LLM features (Text-to-SQL etc.)

---

# 8) v1.5 Roadmap (next highest ROI)

1. **Join table → M:N visualization toggle**
2. **Schema diff viewer** (side-by-side: current vs desired)
3. **Bulk data edit tools**

   * CSV import wizard
   * bulk update with filters
4. **Export migrations**

   * dbt-compatible or “migration bundle” scripts
5. **ERD filters**

   * show only related tables (N hops)
   * hide tables with no relationships

---

# 9) v2 Roadmap (big product moves)

* Multi-database support (MySQL, SQL Server)
* Collaboration (shared diagrams, comments)
* Versioning (diagram history + migration history)
* SSO/RBAC for team + self-hosting
* Optional AI assistant (explain, suggest schema, generate SQL)

---

# 10) Implementation Checklist (engineering handoff)

### Canvas

* [ ] Node virtualization
* [ ] Edge canvas layer
* [ ] LOD rules by zoom
* [ ] Smooth pan/zoom + snap grid
* [ ] Command stack for undo/redo

### Catalog + sync

* [ ] Postgres introspection queries (Part 3)
* [ ] Snapshot cache + refresh strategies
* [ ] Reconcile nodes by stable ref (schema.table)

### Schema apply

* [ ] MigrationPlan builder
* [ ] Preflight checks (nulls/duplicates/fk violations)
* [ ] Apply ordering + index concurrently handling
* [ ] Logging of apply runs

### Data entry

* [ ] Grid + form
* [ ] Related records panel
* [ ] FK selector query + caching
* [ ] Safe writes toggle per workspace

---

## Done — ERD Spec v1 is complete (Parts 1–5)

If you want the next deliverable, I can generate either:

1. **A full PRD + epics/stories** for the build
2. **A JSON schema** for saving diagrams + migrations
3. **A minimal database for the app itself** (projects/workspaces/diagrams/apply logs)

Reply with **PRD**, **JSON**, or **App DB**.
