## ERD Spec v1 (ERD-first Database Studio)

### Product goal

A modern ERD workspace where you can **design schemas visually**, **sync with live databases**, and **drive data entry workflows** through relationships—without needing SQL.

---

## 1) ERD Workspace Layout

### A) Main regions

* **Top bar**

  * Workspace/Env selector (Dev/Stage/Prod)
  * Connection selector
  * Mode toggle: **View / Edit**
  * Actions: **Sync**, **Apply**, **Undo/Redo**, **Search**, **Export**
* **Left rail**

  * **Explorer**: Schemas, Tables, Views
  * **Palette**: New Table, Relationship, Note, Group
* **Center**

  * **Canvas** (infinite pan/zoom)
* **Right inspector**

  * Context panel (Table / Relationship / Selection / Canvas)

### B) Visual style rules (modern)

* Minimal borders, high whitespace
* Subtle grid dots (toggleable)
* Soft shadows for selected nodes
* Relationship lines: thin by default; thick/highlight on hover/path select
* Color used only for meaning: PK badge, FK badges, warnings

---

## 2) Core Objects

### A) Entity node (Table)

**Visual**

* Header: table name + schema badge
* Badges: PK count, FK count, index count (small)
* Body list (virtualized):

  * Column name
  * Data type (muted monospace)
  * Icons: PK, FK, NN (not null), UQ (unique), IDX (indexed)
* Footer: row estimate/size (optional)

**States**

* Default
* Hover (outline + quick actions appear)
* Selected (accent outline + inspector updates)
* Warning (integrity issues banner)

**Quick actions (on hover)**

* * Column
* Preview data
* Open table editor
* Generate SQL (collapsed)

### B) Relationship edge (Foreign Key)

**Visual**

* Connector from child column → parent PK/unique column
* Cardinality markers (crow’s foot style):

  * `1—N`, `1—1`, `0..1—N` (nullable FK), etc.
* Optional label: FK name, on delete/update rule

**States**

* Default
* Hover (highlight, show endpoints)
* Selected (editable in inspector)
* Broken (missing referenced column/table) → red dashed line

### C) Group box

* A movable/resizable container to cluster tables (e.g., “Stats Core”, “Auth”, “ETL”)
* Optional title + color tag

### D) Note

* Sticky note node for annotations (markdown-lite)

---

## 3) Canvas Interaction Model

### A) Navigation

* Pan: Space+Drag or Middle mouse drag
* Zoom: Ctrl/Cmd + Scroll, pinch trackpad
* Zoom to fit: `Shift+1`
* Center on selection: `F`

### B) Selection

* Click selects node/edge
* Shift+Click multi-select
* Drag marquee to select multiple nodes
* Esc clears selection

### C) Moving & resizing

* Drag tables to reposition
* Snap-to-grid optional (default ON)
* Resizing:

  * Node width resizable; height auto based on visible columns (scroll inside node)
* Groups resizable; tables can be dragged into/out of groups

### D) Create table

* `T` hotkey or Palette → “Table”
* Click canvas to place
* Table created with:

  * name (placeholder `new_table`)
  * id column suggestion (configurable)
* Inline rename on create (Enter to confirm)

### E) Create relationship

Two supported flows:

**Flow 1: Drag FK**

* Drag from a column “connector” dot → drop onto referenced table/column
* If dropped on table header: opens “Select referenced column” dialog

**Flow 2: Wizard**

* Click “Relationship” tool → click child table → click parent table → pick columns

System auto-suggests:

* referenced column = parent PK
* child column name = `{parent_table}_id` (configurable)

### F) Editing columns quickly

* Double-click column name → rename
* Inline type dropdown (common types + search)
* Toggle nullability, unique, index via icons

### G) Undo/Redo

* Full canvas operations tracked:

  * move, resize, create, delete, rename, type change, relationship edits
* Hotkeys: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z

---

## 4) Inspector Spec (Right Panel)

### A) When a TABLE is selected

Tabs:

**1) Overview**

* Full name (schema.table)
* Row estimate, size (if connected)
* Flags: has PK? has FK? has indexes?

**2) Columns**

* Editable grid:

  * name, type, null, default, pk, unique
* Add column button
* Reorder columns (optional; physical order if supported)

**3) Keys & Indexes**

* Primary key editor
* Unique constraints
* Index builder (columns + order + partial predicate if supported)

**4) Relationships**

* Inbound FKs (who references me)
* Outbound FKs (I reference who)
* Jump-to highlighting on canvas

**5) SQL / Migration Preview**

* Shows generated SQL diff for just this table
* Copy button
* “Apply changes” button (if allowed)

### B) When a RELATIONSHIP is selected

* FK name
* Child table/columns
* Parent table/columns
* On delete: RESTRICT / CASCADE / SET NULL
* On update: RESTRICT / CASCADE
* Deferrable (if supported)
* Validate button (checks existing data integrity if connected)

### C) When CANVAS is selected (nothing selected)

* Diagram settings:

  * show/hide schema badges
  * show/hide column types
  * show only keys (PK/FK) mode
  * grid/snap toggle
* Auto layout options
* Export options

---

## 5) Auto Layout & Routing

### A) Auto layout modes

* **Cluster by schema** (default)
* **Cluster by relationship communities** (graph clustering)
* **Left-to-right flow** (facts left, dims right—optional preset)

### B) Edge routing

* Orthogonal routing preferred (right-angle)
* Avoid crossing where possible
* When overlaps occur:

  * edge “bridge” indicators on crossings
  * hover isolates path

### C) Performance

* Virtualize column lists in table nodes (only render visible rows)
* Progressive layout: render nodes first, route edges after

---

## 6) Search, Filter, and Focus

### A) Global search (Cmd/Ctrl+K)

Search across:

* tables
* columns
* relationships (FK name)
  Actions:
* Jump to node
* Highlight all references
* “Show join path” (see below)

### B) Filters

* Schema filter
* Hide views toggle
* Show only:

  * tables with no PK
  * tables with no relationships
  * join tables (many-to-many candidates)
  * warnings

### C) “Join Path” focus mode

User selects two tables → app highlights:

* shortest FK path between them
* intermediate tables
* edge directions and cardinality

---

## 7) Diagram Persistence & Sync

### A) Storage model

* **Diagram Layout** stored separate from DB schema:

  * node positions, sizes
  * collapsed/expanded state
  * group boxes
  * notes
  * per-user view settings

### B) Sync modes

1. **Reverse engineer**

* Load schema metadata → generate diagram nodes/edges
* Preserve layout if table IDs match

2. **Design-first**

* User edits diagram → generate migration diff SQL

3. **Hybrid**

* Detect drift:

  * schema changed outside tool
  * show “incoming changes” panel
  * user chooses to merge

### C) Drift rules (v1)

* If a table exists but columns changed:

  * keep node position
  * mark updated columns in inspector
* If a table deleted:

  * keep ghost node (disabled) until user confirms removal from diagram
* If FK invalid:

  * mark edge as broken (red dashed)

---

## 8) Validation & Warnings (ERD-level)

### Table warnings

* No primary key
* Duplicate column names
* Columns without types
* Reserved keywords
* Excessive nullable FKs (optional)
* Suspected join table missing composite unique

### Relationship warnings

* FK references non-unique parent column
* Nullable FK but cardinality set to required
* ON DELETE CASCADE on “high-risk” relationships (configurable)

Warnings appear:

* as a small badge on table/edge
* in a “Validation” panel list
* click to jump + fix

---

## 9) Export / Share

### Export options

* PNG/SVG of current view
* “Schema only” JSON (tables/columns/relationships)
* “Layout + notes” JSON (full diagram)
* SQL DDL bundle (per dialect)

---

## 10) v1 Acceptance Criteria (ship checklist)

* Can connect to a DB and auto-generate an ERD (tables + PK/FK)
* Can create/edit tables/columns/relationships visually
* Inspector edits persist and generate a migration preview
* Undo/redo works for all diagram edits
* Search can jump to any table/column
* Auto layout works and doesn’t destroy manual layout (user can opt-in)
* Export image works

---

# 11) Data Structures (TypeScript)

## 11.1 Core IDs

```ts
type ID = string; // nanoid/uuid

type Dialect = "postgres" | "mysql" | "sqlserver" | "sqlite";

type SchemaRef = {
  dialect: Dialect;
  database?: string;
  schema: string;
};
```

## 11.2 Catalog (DB metadata snapshot)

This is what ERD + schema diff rely on.

```ts
export interface CatalogSnapshot {
  capturedAt: string; // ISO
  dialect: Dialect;
  connectionId: ID;

  schemas: Record<string, CatalogSchema>; // key: schema name
}

export interface CatalogSchema {
  name: string;
  tables: Record<string, CatalogTable>; // key: table name
  views: Record<string, CatalogView>;
}

export interface CatalogTable {
  name: string;
  schema: string;

  columns: CatalogColumn[];
  primaryKey?: CatalogPrimaryKey;
  uniques: CatalogUnique[];
  indexes: CatalogIndex[];
  foreignKeys: CatalogForeignKey[];

  // optional stats
  estimatedRowCount?: number;
  sizeBytes?: number;
  lastAnalyzedAt?: string;
}

export interface CatalogView {
  name: string;
  schema: string;
  definition?: string; // may be truncated
  columns: CatalogColumn[];
}

export interface CatalogColumn {
  name: string;
  ordinalPosition: number;
  dataType: string;           // dialect type text
  isNullable: boolean;
  defaultExpression?: string; // raw default
  isIdentity?: boolean;
  isGenerated?: boolean;

  // optional: detected properties
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
}

export interface CatalogPrimaryKey {
  name?: string;
  columns: string[]; // column names
}

export interface CatalogUnique {
  name?: string;
  columns: string[];
}

export interface CatalogIndex {
  name: string;
  columns: { name: string; order?: "ASC" | "DESC" }[];
  isUnique?: boolean;
  predicate?: string; // partial index (pg)
  method?: string;    // btree/hash/gin (pg)
}

export interface CatalogForeignKey {
  name?: string;
  childTable: string;
  childSchema: string;
  childColumns: string[];

  parentTable: string;
  parentSchema: string;
  parentColumns: string[];

  onDelete?: "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT" | "NO ACTION";
  onUpdate?: "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT" | "NO ACTION";
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}
```

## 11.3 Diagram model (layout + design-first edits)

```ts
export interface DiagramModel {
  id: ID;
  name: string;

  connectionId?: ID; // optional for offline design-first
  dialect: Dialect;
  schemaScope: { schemas: string[] }; // which schemas are included

  nodes: Record<ID, TableNode>;
  edges: Record<ID, RelationshipEdge>;
  groups: Record<ID, GroupBox>;
  notes: Record<ID, NoteNode>;

  view: DiagramViewState;
  createdAt: string;
  updatedAt: string;
}

export interface TableNode {
  id: ID;
  ref: { schema: string; table: string }; // logical identity for preserving layout across sync

  position: { x: number; y: number };
  size: { w: number; h: number };
  collapsed?: boolean;

  // design-first overrides (optional)
  draft?: DraftTableEdits;

  ui: {
    colorTag?: string;
    showTypes?: boolean;
    pinned?: boolean;
  };
}

export interface DraftTableEdits {
  // If present, means this table has pending changes not applied to DB.
  columns?: DraftColumnEdits[];
  primaryKey?: { columns: string[]; name?: string } | null;
  uniques?: { columns: string[]; name?: string }[];
  indexes?: DraftIndexEdits[];
}

export interface DraftColumnEdits {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultExpression?: string;

  // extras (pg)
  isIdentity?: boolean;
}

export interface DraftIndexEdits {
  name?: string;
  columns: { name: string; order?: "ASC" | "DESC" }[];
  unique?: boolean;
  method?: string;
  predicate?: string;
}

export interface RelationshipEdge {
  id: ID;
  ref?: { // stable matching across sync
    childSchema: string; childTable: string;
    parentSchema: string; parentTable: string;
    childColumns: string[]; parentColumns: string[];
    name?: string;
  };

  child: { nodeId: ID; schema: string; table: string; columns: string[] };
  parent:{ nodeId: ID; schema: string; table: string; columns: string[] };

  rules: {
    onDelete?: CatalogForeignKey["onDelete"];
    onUpdate?: CatalogForeignKey["onUpdate"];
    deferrable?: boolean;
    initiallyDeferred?: boolean;
  };

  ui: {
    routing?: "orthogonal" | "straight";
    label?: string;
  };

  status?: "ok" | "broken" | "pending";
}

export interface GroupBox {
  id: ID;
  title: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  colorTag?: string;
  nodeIds: ID[];
}

export interface NoteNode {
  id: ID;
  position: { x: number; y: number };
  size: { w: number; h: number };
  text: string;
}

export interface DiagramViewState {
  zoom: number;
  pan: { x: number; y: number };
  grid: { enabled: boolean; snap: boolean };
  filters: {
    schemas?: string[];
    hideViews?: boolean;
    onlyKeys?: boolean;
    warningsOnly?: boolean;
  };
}
```

---

# 12) Interaction Event Map (Commands + Undo/Redo)

## 12.1 Command pattern

Every user action becomes a **command** with:

* `do()` apply
* `undo()` revert
* metadata for audit/history

```ts
export type Command =
  | { type: "NODE_MOVE"; nodeIds: ID[]; from: {x:number;y:number}[]; to: {x:number;y:number}[] }
  | { type: "NODE_RESIZE"; nodeId: ID; from: {w:number;h:number}; to: {w:number;h:number} }
  | { type: "TABLE_CREATE"; node: TableNode }
  | { type: "TABLE_DELETE"; nodeId: ID; snapshot: TableNode }
  | { type: "COLUMN_ADD"; nodeId: ID; column: DraftColumnEdits }
  | { type: "COLUMN_EDIT"; nodeId: ID; from: DraftColumnEdits; to: DraftColumnEdits }
  | { type: "COLUMN_DELETE"; nodeId: ID; columnName: string; snapshot: DraftColumnEdits }
  | { type: "PK_SET"; nodeId: ID; from?: string[]|null; to?: string[]|null }
  | { type: "EDGE_CREATE"; edge: RelationshipEdge }
  | { type: "EDGE_DELETE"; edgeId: ID; snapshot: RelationshipEdge }
  | { type: "EDGE_EDIT"; edgeId: ID; from: RelationshipEdge; to: RelationshipEdge }
  | { type: "GROUP_CREATE"; group: GroupBox }
  | { type: "GROUP_EDIT"; groupId: ID; from: GroupBox; to: GroupBox }
  | { type: "NOTE_CREATE"; note: NoteNode }
  | { type: "NOTE_EDIT"; noteId: ID; from: string; to: string };
```

## 12.2 Undo/redo guarantees

* Must work across: move, resize, create/delete, rename, relationship edits
* Batched commands:

  * drag-move across multiple nodes becomes 1 command
  * auto-layout becomes 1 command

## 12.3 “Pending changes” model

* Any change that impacts DB schema sets `diagram.updatedAt` and marks:

  * `node.draft` populated
  * or `edge.status="pending"`

---

# 13) Schema Diff Engine (Visual → Migration Plan)

## 13.1 Concept

We produce a `MigrationPlan` from:

* `CatalogSnapshot` (current DB)
* `DiagramModel` (desired state)

```ts
export interface MigrationPlan {
  id: ID;
  dialect: Dialect;
  createdAt: string;
  steps: MigrationStep[];
  warnings: string[];
  risk: "low" | "medium" | "high";
}

export type MigrationStep =
  | { kind: "CREATE_TABLE"; schema: string; table: string; ddl: string }
  | { kind: "ALTER_TABLE"; schema: string; table: string; ddl: string }
  | { kind: "ADD_FK"; ddl: string }
  | { kind: "DROP_FK"; ddl: string }
  | { kind: "CREATE_INDEX"; ddl: string }
  | { kind: "DROP_INDEX"; ddl: string };
```

## 13.2 v1 diff rules (safe-first)

* **Additive changes** allowed by default:

  * add table, add column, add index, add FK
* **Destructive changes** require explicit “unsafe mode”:

  * drop column, rename column, change type, drop table, drop constraints

## 13.3 Rename detection (v1 conservative)

* No automatic rename matching unless user confirms:

  * “Did you rename `playerId` → `player_id`?”
* Otherwise treat as drop+add (unsafe)

---

# 14) Postgres-first Introspection Contract (Minimum)

**We need:**

* tables, columns (type/null/default)
* PK, unique, indexes
* FKs with rules
* view definitions optional
* row estimate/size optional

v1 contract:

* `GET /catalog?schemas=public,stats`
* returns `CatalogSnapshot`

(We can write the exact SQL for pg catalog queries next.)

---

# 15) Data Entry UX Tied to ERD (Your focus)

This is where ERD becomes more than a picture.

## 15.1 “Data” mode per table

From ERD: click a table → **Open Data**
Layout:

* Main: row grid (paginated)
* Right: record form (selected row)
* Bottom: related records tabs (children)

## 15.2 Relationship-aware editing

* FK columns render as:

  * searchable dropdown (show label columns)
  * “open referenced record” button
* Child tables show inline editor:

  * add/remove child rows linked automatically

## 15.3 Reference display rules

For any FK, pick a display column:

* default: `name` if exists, else first text-like col, else PK
* user can override per relationship

---

# Next (I’ll do immediately in the next message)

**ERD Spec Part 3:**

1. Exact **Postgres introspection SQL** (PK/FK/indexes/views/stats)
2. Migration SQL generation examples (create table + fk + index)
3. Data entry “FK selector query” patterns (fast + safe)

Just say **“Part 3”**.
