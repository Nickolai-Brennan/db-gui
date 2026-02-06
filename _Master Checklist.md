## Start-to-Finish Master Checklist (with Subtasks)

Format: **Section → Subsection → Task → Subtasks**
(Use this directly in your Checklist Builder as a seed template.)

---

# 0) Project Setup

## 0.1 Repo + standards

* [ ] Choose repo structure

  * [x] Monorepo (pnpm/turbo) OR split FE/BE repos
  * [ ] Define package boundaries (app-web, api, shared)
* [ ] Code quality baseline

  * [x] ESLint + Prettier config
  * [ ] EditorConfig
  * [ ] Commit hooks (lint-staged)
* [ ] CI/CD baseline

  * [ ] Build pipeline for FE + BE
  * [ ] Typecheck in CI
  * [ ] Unit test runner wired
* [ ] Environments

  * [ ] Dev env config
  * [ ] Stage env config
  * [ ] Prod env config
  * [ ] Env var convention + validation

## 0.2 Product decisions locked

* [ ] ERD-first UX confirmed

  * [ ] ERD is default route after selecting connection
  * [ ] SQL editor is secondary tab
* [ ] Postgres-first confirmed

  * [ ] Dialect abstraction interface created (future DBs)
* [ ] Safe Mode default confirmed

  * [ ] Define “Safe Mode” allowed ops list
* [ ] Checklist = Dashboard confirmed

  * [ ] Dashboard must render from checklist instance state

---

# 1) App DB (Persistence Layer)

## 1.1 Create schema + migrations

* [ ] Migrations framework installed

  * [ ] Choose tool (Prisma/Drizzle/Flyway/sql-migrate)
  * [ ] Local migration run script
  * [ ] CI migration check
* [ ] Core tables created

  * [ ] workspaces
  * [ ] connections
  * [ ] checklist_templates
  * [ ] checklist_template_versions
  * [ ] checklist_nodes
  * [ ] checklist_instances
  * [ ] checklist_instance_results
  * [ ] checklist_evidence (optional v1)
  * [ ] checklist_overrides (optional v1)
* [ ] Indexes + constraints added

  * [ ] unique(workspace_id, slug) on templates
  * [ ] unique(template_id, version) on versions
  * [ ] unique(instance_id, node_id) on results
  * [ ] parent_id index on nodes
  * [ ] connection_id index on instances

## 1.2 Seed data

* [ ] Seed system templates

  * [ ] ERD Health
  * [ ] Migration Safety
  * [ ] Data Entry Readiness
* [ ] Seed demo workspace + connection placeholders
* [ ] Seed a published template version for each system template

---

# 2) Backend API (Minimum to Ship)

## 2.1 Templates API

* [ ] Templates list/create/update

  * [ ] GET templates (workspace)
  * [ ] POST template
  * [ ] PATCH template metadata
* [ ] Version management

  * [ ] POST create version (draft)
  * [ ] POST publish version
  * [ ] Enforce immutability on published versions
* [ ] Nodes CRUD

  * [ ] GET nodes (nested tree)
  * [ ] POST create node (group/item)
  * [ ] PATCH update node fields
  * [ ] DELETE node
  * [ ] POST reorder/move nodes (batch)
  * [ ] Validate parent-child constraints (no cycles)

## 2.2 Instances API

* [ ] Instance creation + retrieval

  * [ ] POST create instance (scopeType + scopeRef)
  * [ ] GET instance summary (counts + status)
* [ ] Instance tree

  * [ ] GET instance tree (template nodes + computed statuses)
  * [ ] Include per-item result payload merged in
* [ ] Issues queue

  * [ ] GET issues list (flattened)
  * [ ] Support filters: severity, section, schema, table
  * [ ] Sort: blocking first, then warnings
* [ ] Manual item updates

  * [ ] PATCH result status
  * [ ] Add note + checked_by
  * [ ] Evidence attach endpoint (optional)

## 2.3 Checks runtime

* [ ] Check registry (builtins)

  * [ ] Define check interface (run(ctx) → results)
  * [ ] Register builtin checks by ID
* [ ] Run endpoints

  * [ ] POST run all checks
  * [ ] POST run selected node IDs
  * [ ] Store outputs (summary, rows sample, stats)
* [ ] SQL template runner

  * [ ] Variable injection (schemas, thresholds)
  * [ ] Row cap + timeout
  * [ ] Mapping results to target_ref
* [ ] SQL test endpoint for builder

  * [ ] POST test SQL
  * [ ] Return sample rows + inferred mapping suggestions

## 2.4 ERD binding endpoints

* [ ] GET annotations for ERD

  * [ ] Table badge aggregation
  * [ ] Relationship issue aggregation
  * [ ] Include fix actions + deepLink refs
* [ ] Standardize deepLink schema

  * [ ] table focus link shape
  * [ ] relationship focus link shape
  * [ ] column focus link shape

---

# 3) Postgres Introspection Layer (ERD + checks)

## 3.1 Catalog snapshot service

* [ ] Implement catalog fetch pipeline

  * [ ] tables + row estimates + size
  * [ ] columns + types + nullability + defaults
  * [ ] PK + unique constraints
  * [ ] foreign keys + rules + deferrable
  * [ ] indexes + method + predicate
  * [ ] views definitions (optional v1)
* [ ] Normalize into CatalogSnapshot model

  * [ ] Consistent identifiers (schema/table/column)
  * [ ] Stable relationship signatures

## 3.2 Caching + refresh

* [ ] Cache snapshots per connection + schema scope

  * [ ] Storage: memory + persistent (app DB) optional
* [ ] Refresh modes

  * [ ] Refresh all schemas
  * [ ] Refresh visible tables only (v1.5 ok)
* [ ] Drift detection (light v1)

  * [ ] Manual refresh button
  * [ ] “Last refreshed” timestamp

---

# 4) Checklist Engine (Control Plane)

## 4.1 Core status computation

* [ ] Item status rules implemented

  * [ ] 0 rows returned = pass
  * [ ] rows returned > 0 = fail/warn/blocked based on severity
  * [ ] manual unchecked state support
* [ ] Group rollup rules implemented

  * [ ] blocked > fail > warning > pass > incomplete
* [ ] Instance rollups

  * [ ] counts (blocking/warn/fail)
  * [ ] overall status
  * [ ] last_run_at updates

## 4.2 Target binding + mapping

* [ ] target_selector support

  * [ ] all_tables
  * [ ] each_relationship (FK)
  * [ ] specific table
* [ ] result_mapping support

  * [ ] schema+table mapping
  * [ ] schema+table+column mapping
  * [ ] FK signature mapping
* [ ] target_ref stored for every failing result

  * [ ] table target_ref
  * [ ] relationship target_ref
  * [ ] column target_ref

## 4.3 Builtin checks (v1)

* [ ] NO_PRIMARY_KEY

  * [ ] Query tables without PK
  * [ ] Map to table target_ref
* [ ] FK_NOT_INDEXED

  * [ ] Parse index defs or structured index cols
  * [ ] Leading-column match logic
  * [ ] Map to relationship + child table
* [ ] FK_HAS_VIOLATIONS

  * [ ] Generate join predicate for FK
  * [ ] Count violations + sample rows
* [ ] FK_BROKEN (diagram drift)

  * [ ] Compare diagram edges to catalog snapshot
* [ ] FK_REFERENCES_NON_UNIQUE_PARENT

  * [ ] Check parent cols match PK/unique
* [ ] RISKY_CASCADE

  * [ ] Flag cascade deletes (policy-based)

## 4.4 Fix actions (v1)

* [ ] Define fix action registry

  * [ ] AUTO_CREATE_INDEX
  * [ ] OPEN_VIOLATIONS
  * [ ] OPEN_TABLE_KEYS_EDITOR
  * [ ] OPEN_RELATIONSHIP_EDITOR
* [ ] Fix action execution flow

  * [ ] Show SQL preview
  * [ ] Run preflight checks (if needed)
  * [ ] Apply / cancel
  * [ ] Log result

---

# 5) Frontend: App Shell + Design System

## 5.1 App shell

* [ ] TopBar

  * [ ] Workspace selector
  * [ ] Connection selector
  * [ ] Schema chips (scope)
  * [ ] Refresh checks button
  * [ ] Command palette trigger
* [ ] LeftNav

  * [ ] Dashboard, ERD, Tables, Data, Migrations, Checklists, Settings
* [ ] Layout responsiveness

  * [ ] Collapsible nav
  * [ ] Resizable panes (v1.5 ok)

## 5.2 Design system basics

* [ ] Dark theme tokens
* [ ] Typography scale
* [ ] Button styles + status badges
* [ ] Table/grid styles
* [ ] Modal/sheet patterns
* [ ] Toast/notification patterns

---

# 6) Frontend: Checklist Builder (Templates)

## 6.1 Templates list + versioning

* [ ] Templates page

  * [ ] List templates + status
  * [ ] Create template modal
* [ ] Template detail page

  * [ ] Versions list
  * [ ] Create new version
  * [ ] Publish version action + confirm dialog

## 6.2 Builder editor page

* [ ] Tree panel

  * [ ] Render infinite depth tree
  * [ ] Expand/collapse
  * [ ] Drag/drop reorder/move
  * [ ] Keyboard: Enter/Tab/Shift-Tab
  * [ ] Context menu actions
* [ ] Node editor panel

  * [ ] Group editor (title/desc)
  * [ ] Item editor (type/severity/scope/target)
  * [ ] Builtin vs SQL template selector
  * [ ] SQL editor (monospace) for templates
  * [ ] Result mapping UI
  * [ ] Pass/fail rule UI
  * [ ] Fix action config UI
* [ ] Preview/validation panel

  * [ ] “Test SQL” results table
  * [ ] Mapping suggestion display
  * [ ] Show derived target_ref examples

---

# 7) Frontend: Instances + Dashboard

## 7.1 Dashboard page

* [ ] Readiness hero card

  * [ ] Status + counts
  * [ ] Primary CTA based on status
* [ ] Section scorecards

  * [ ] ERD Integrity / Schema Safety / Performance / Data Entry
  * [ ] Click filters issues queue
* [ ] Issues work queue

  * [ ] Filters: severity/section/schema/table
  * [ ] Sorting: blocking first
  * [ ] Actions: jump to ERD/table, run check, fix
* [ ] Quick actions panel

  * [ ] Apply (gated)
  * [ ] Run checks
  * [ ] Open ERD focus mode
* [ ] Recent activity (optional)

## 7.2 Instance page

* [ ] Summary header

  * [ ] Status + last run + run buttons
* [ ] Instance tree view

  * [ ] Show computed statuses per node
  * [ ] Clicking item shows details + evidence
* [ ] Manual check flows

  * [ ] Mark pass/fail + notes
  * [ ] Evidence add (optional)

---

# 8) ERD v1 (Diagram + Inspector + Annotations)

## 8.1 ERD read-only (minimum viable)

* [ ] Load catalog snapshot into nodes/edges
* [ ] Render table nodes

  * [ ] Header + column list
  * [ ] Collapse behavior
* [ ] Render relationship edges

  * [ ] Basic routing (straight ok v1)
* [ ] Pan/zoom + selection
* [ ] Search jump to table

## 8.2 Checklist annotations overlay (must-have)

* [ ] Fetch annotations endpoint for instance
* [ ] Table badges on nodes (count + severity)
* [ ] Edge dots on relationships
* [ ] Hover tooltips show top issues
* [ ] Click badge/dot opens Validation tab filtered
* [ ] Spotlight mode from dashboard issue click

## 8.3 Inspector (v1 essentials)

* [ ] Table inspector tabs

  * [ ] Overview
  * [ ] Columns
  * [ ] Keys & Indexes
  * [ ] Relationships
  * [ ] Validation (issues list)
* [ ] Relationship editor (v1 view + edit later)

  * [ ] Show fk name, cols, rules
  * [ ] Validation list
  * [ ] Jump to fix actions

---

# 9) Data Entry v1 (Relational CRUD)

## 9.1 Data grid

* [ ] Basic query runner for table

  * [ ] Limit + offset pagination
  * [ ] Default sort key
* [ ] Inline filter (basic)
* [ ] Copy row/cell
* [ ] Export CSV (optional)

## 9.2 Record form

* [ ] Select row → form view
* [ ] Required fields (NOT NULL) enforced
* [ ] Insert/update with parameterized queries

## 9.3 Relationship-aware panels

* [ ] Child records tabs based on inbound FKs
* [ ] Add child record auto-inject FK value
* [ ] FK selector dropdown for outbound FKs

  * [ ] Label column rule (name/first text/PK fallback)
  * [ ] Search query + caching

## 9.4 Safety controls

* [ ] Read-only default toggle
* [ ] Confirm deletes
* [ ] (Optional) soft delete mapping support

---

# 10) Schema Builder + Migrations (v1 safe)

## 10.1 Migration plan generator (minimum)

* [ ] Generate SQL for additive changes only

  * [ ] Create table
  * [ ] Add column
  * [ ] Add index
  * [ ] Add FK
* [ ] Risk scoring

  * [ ] low/medium/high rules

## 10.2 Preflight checks (blocking)

* [ ] NOT NULL checks (null counts)
* [ ] UNIQUE checks (duplicates)
* [ ] FK checks (violations)
* [ ] Show sample offending rows

## 10.3 Apply engine

* [ ] Step ordering enforced
* [ ] Index concurrently strategy

  * [ ] Non-transaction steps handled separately
* [ ] Apply logs persisted

  * [ ] who/when/sql/status/errors

---

# 11) QA + Security + Release

## 11.1 Testing

* [ ] Unit tests

  * [ ] Rollup computation
  * [ ] Builtin checks mapping to target_ref
* [ ] Integration tests

  * [ ] Introspection queries on test DB
  * [ ] “Run checks” endpoint end-to-end
* [ ] UI tests (smoke)

  * [ ] Builder tree drag/drop
  * [ ] Dashboard issue deep-link to ERD

## 11.2 Security

* [ ] Secrets storage strategy

  * [ ] encrypted at rest
  * [ ] never logged
* [ ] Parameterized queries only
* [ ] RBAC minimal

  * [ ] template edit vs view
  * [ ] apply allowed roles
* [ ] Audit log for apply + overrides

## 11.3 Release readiness

* [ ] Seed templates validated
* [ ] Onboarding demo workspace
* [ ] Telemetry + error tracking live
* [ ] Backup + restore plan for app DB

---

## If you want, I can convert this into:

* **Seed JSON** for the Checklist Builder (ready to insert as a published template version), or
* A **task breakdown** formatted for your master task sheet (Project ID, Phase, Hat, urgency, time).
