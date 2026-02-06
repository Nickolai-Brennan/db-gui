## Frontend Blueprint v1 (Checklist-first Database GUI)

This is the buildable plan for your React app: routes, components, state model, data hooks, and key interactions. It’s designed so you can start coding immediately.

---

# 1) Stack Recommendation (frontend)

* **React + TypeScript**
* **Vite**
* **TailwindCSS** (token-based theme)
* **Zustand** (simple state, ideal for canvas + UI panes)
* **TanStack Query** (server state + caching)
* **TanStack Router** (optional, but nice)
* **dnd-kit** (tree drag/drop)
* **React Flow OR custom canvas** (v1 can start with React Flow; scale later)

---

# 2) Routes (App Map)

## Core

* `/` → redirect to last workspace/dashboard
* `/w/:wsId/dashboard`
* `/w/:wsId/erd/:diagramId`
* `/w/:wsId/tables`
* `/w/:wsId/table/:schema/:table`
* `/w/:wsId/data/:schema/:table`
* `/w/:wsId/migrations`
* `/w/:wsId/settings/checklists`
* `/w/:wsId/settings/checklists/templates/:templateId`
* `/w/:wsId/settings/checklists/templates/:templateId/versions/:versionId`
* `/w/:wsId/checklists/instances/:instanceId`

---

# 3) Page Layout Shell (consistent UI)

### `<AppShell>`

* `<TopBar />`
* `<LeftNav />`
* `<MainContent />`
* Optional: `<RightInspector />` (context)

### `<TopBar />`

* Workspace selector
* Connection selector
* Schema chips
* Global search (Cmd/Ctrl+K)
* Actions: refresh checks, open ERD, apply (gated)

### `<LeftNav />`

* Dashboard
* ERD
* Tables
* Data
* Migrations
* Checklists
* Settings

---

# 4) Component Inventory (what to build)

## 4.1 Dashboard (Checklist = Control Center)

### `/dashboard`

**Components**

* `<ReadinessHeroCard />`
* `<SectionScorecards />`
* `<IssuesWorkQueue />`
* `<QuickActionsPanel />`
* `<RecentActivity />` (optional)

**Work queue row actions**

* “Go to ERD”
* “Open Table”
* “Run Check”
* “Fix” (if available)

---

## 4.2 ERD Page (diagram + highlights)

### `/erd/:diagramId`

**Components**

* `<ErdCanvas />`
* `<ErdToolbar />`
* `<ErdExplorerDrawer />` (left, collapsible)
* `<InspectorPanel />` (right)
* `<ValidationDrawer />` (bottom or right tab)

**Canvas subcomponents**

* `<TableNode />`
* `<RelationshipEdge />`
* `<ErdAnnotationLayer />` (paints badges/dots based on checklist annotations)
* `<MiniMap />` (optional)

**Inspector tabs**

* Overview
* Columns
* Keys & Indexes
* Relationships
* Validation (annotations list)
* SQL Preview (migration diff for selection)

---

## 4.3 Checklist Builder (Templates)

### `/settings/checklists`

**Components**

* `<ChecklistTemplatesList />`
* `<TemplateEditorLayout />`

### `/templates/:templateId/versions/:versionId`

**Components**

* `<ChecklistTree />` (left)
* `<NodeEditor />` (center)
* `<NodePreview />` (right)
* `<BuilderToolbar />` (publish, validate, export)

Tree uses:

* `<TreeNodeRow />`
* `<TreeDnDProvider />` (dnd-kit)

---

## 4.4 Checklist Instances (Run + Results)

### `/checklists/instances/:instanceId`

**Components**

* `<InstanceSummaryHeader />`
* `<InstanceTree />` (computed statuses)
* `<InstanceIssuesWorkQueue />`
* `<RunChecksButton />`
* `<EvidencePanel />`

---

# 5) State Model (Zustand stores)

## 5.1 UI store (global shell)

```ts
type UiState = {
  workspaceId?: string;
  connectionId?: string;
  schemas: string[];
  leftNavCollapsed: boolean;

  commandPaletteOpen: boolean;

  setConnection: (id: string) => void;
  setSchemas: (schemas: string[]) => void;
};
```

## 5.2 ERD store (canvas + selection)

```ts
type ErdState = {
  diagramId?: string;

  zoom: number;
  pan: { x: number; y: number };

  selected: { kind: "table"|"edge"|"none"; id?: string };

  // layout state
  nodes: Record<string, { x:number; y:number; w:number; h:number; ref:{schema:string;table:string} }>;
  edges: Record<string, any>;

  // annotations from checklist
  annotations: {
    tableBadges: Record<string, { severity: string; count: number }>; // key: schema.table
    edgeIssues: Record<string, { severity: string; codes: string[] }>; // key: edgeSignature
  };

  setSelected: (sel: ErdState["selected"]) => void;
  applyAnnotations: (payload: any) => void;
};
```

## 5.3 Checklist builder store (local to editor)

```ts
type ChecklistBuilderState = {
  versionId?: string;
  selectedNodeId?: string;

  // normalized nodes from API
  nodesById: Record<string, any>;
  rootId?: string;

  // drag state
  draggingId?: string;

  selectNode: (id: string) => void;
  updateNodeDraft: (id: string, patch: any) => void;
};
```

---

# 6) Server State (TanStack Query hooks)

## 6.1 Hooks to implement (minimum)

* `useTemplates(wsId)`
* `useTemplate(templateId)`
* `useVersionNodes(versionId)` (returns nested + normalized)
* `useCreateNode(versionId)`
* `usePatchNode(nodeId)`
* `useReorderNodes(versionId)`
* `usePublishVersion(versionId)`

## 6.2 Instances + Dashboard

* `useInstance(instanceId)`
* `useInstanceTree(instanceId)`
* `useInstanceIssues(instanceId, filters)`
* `useRunInstanceChecks(instanceId)`
* `useAnnotations(instanceId)` ← ERD highlight feed

---

# 7) Key UI Interactions (must feel premium)

## 7.1 Checklist Tree interactions

* **Enter**: create sibling node
* **Tab**: indent (make child)
* **Shift+Tab**: outdent
* Drag to reorder/move between parents
* Right click node:

  * Add child group
  * Add item
  * Duplicate
  * Delete
  * Convert group↔item (optional)

## 7.2 Node Editor interactions

* Auto-save with debounce (500ms) or explicit Save button (your choice)
* When Automatic:

  * choose builtin vs SQL template
  * “Test query” button (calls backend test endpoint)
  * mapping UI for returned columns

## 7.3 Dashboard → ERD jump

* Clicking an issue:

  * navigates to ERD page
  * passes focus ref in URL (or router state)
  * ERD opens spotlight mode and selects the target

Example:
`/erd/diag-123?focus=relationship&child=stats.game&parent=stats.player&cols=player_id:id`

## 7.4 ERD annotation behavior

* Table badge click → opens Validation tab filtered to that table
* Edge dot click → opens relationship editor + issues list
* Hover table → highlight connected edges and show top issues tooltip

---

# 8) “Deep Link” Contract (URL patterns)

Standardize deep links so everything can jump cleanly:

### Focus a table

`?focus=table&schema=stats&table=game`

### Focus a relationship

`?focus=relationship&childSchema=stats&childTable=game&childCols=player_id&parentSchema=stats&parentTable=player&parentCols=id`

### Focus a column

`?focus=column&schema=stats&table=game&column=player_id`

---

# 9) Starter Screens to build first (order matters)

### Build order (fastest path)

1. **Templates list + Version editor (tree + node editor)**
2. **Instances page + Issues queue**
3. **Dashboard summary cards + issues**
4. **ERD page with annotations layer** (even if canvas is basic at first)
5. Add “Run checks” wiring (builtin checks)

That gets you a real MVP quickly.

---

# 10) One extra endpoint you’ll want (for builder UX)

### Test SQL for an automatic item

**POST** `/checklist-template-versions/:versionId/test-sql`

```json
{ "sql":"SELECT ...", "variables":{ "schemas":["public","stats"] } }
```

Returns:

* sample rows (capped)
* inferred mapping suggestions (detect schema/table columns)

---

If you want, next I can generate **the exact React component scaffolds** (file tree + TS props + Zustand stores + TanStack Query hooks) so you can drop it into a repo and start implementing.
