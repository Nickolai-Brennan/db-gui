Cool — I’m going to treat **“11” as Option 1**: the **Dashboard Layout Spec** (Checklist-first control center).

# Dashboard Layout Spec v1 (Checklist = Dashboard)

## 1) Dashboard Goals

* Show **overall readiness** at a glance (per connection / schema / project)
* Surface **blocking issues first**
* Provide **one-click drilldown** into ERD/table/data-entry fix points
* Gate dangerous actions (Apply migrations) with checklist state

---

## 2) Dashboard Information Architecture

### Top-level tabs (left nav)

* **Dashboard**
* **ERD**
* **Tables**
* **Data**
* **Migrations**
* **Settings**

Dashboard is always the entry point.

---

## 3) Dashboard Layout (Top → Bottom)

### A) Header strip

* **Workspace**: Dev / Stage / Prod
* **Connection** selector
* **Schema scope** (chips): public, stats, auth
* Buttons (right): **Refresh checks**, **Export report**

### B) “Database Readiness” Summary Card (Hero)

Shows a single status with reasons:

* Status badge: ✅ Pass / ⚠ Warnings / ❌ Blocked
* Counts:

  * Blocking: X
  * Warnings: Y
  * Passed: Z
* Primary CTA:

  * If blocked: **Fix blockers**
  * If warnings: **Review warnings**
  * If pass: **Open ERD**

### C) Section Scorecards (4 cards)

Each card maps to a checklist section:

1. **ERD Integrity**
2. **Schema Safety**
3. **Performance**
4. **Data Entry Readiness**

Each card displays:

* Status badge + count (e.g., ❌ 2 blockers)
* Top 1–2 failing items (short titles)
* CTA: **View issues**

Clicking a card filters the issues list to that section.

### D) “Issues to Fix” Work Queue (the heart of the dashboard)

A table/list with rows like:

* Severity (❌ / ⚠)
* Issue title
* Scope (DB / Schema / Table / Relationship)
* Object (e.g., `stats.game.player_id`)
* Recommended fix (button)
* Jump links: **Go to ERD**, **Open Table**, **Run check**

Default sorting:

1. Blocking
2. Highest impact
3. Most recent drift

Filters:

* Severity (blocking/warn)
* Section
* Schema
* Table
* “Only items with auto-fix”

### E) “Quick Actions” Panel (right side or below issues)

Context-aware actions, but gated:

* **Apply pending migrations**

  * Disabled if blocking issues exist
* **Generate migration preview**
* **Run integrity checks**
* **Open ERD at problem areas**
* **Create new table**
* **Import CSV into table** (optional v1.5)

### F) “Recent Activity” (bottom)

Lightweight audit feed:

* Last schema apply
* Last diagram edit
* Last failed preflight check
* Last data entry changes (optional)

---

## 4) Drilldown Behavior (critical UX)

### Clicking an issue

Must open the correct place, not a generic page:

* Table issue → opens **Table Inspector** on the relevant tab
* FK issue → opens **ERD**, zooms to edge, selects it, opens FK editor
* Index issue → opens table **Indexes** tab + “Create index” prefilled
* Data entry issue → opens **Data view** with offending rows filtered

### “Fix blockers” CTA

Opens a dedicated mode:

* Shows only blocking items
* Step-by-step guided fixes
* Progress bar (blockers remaining)

---

## 5) Visual Rules (modern + calm)

* No chart spam. Counts + status + actionable queue.
* Use color only for:

  * pass/warn/fail
  * selected row highlight
* Lots of whitespace, readable typography, minimal borders.

---

## 6) Dashboard States (must design these)

### Empty state (no connection)

* CTA: **Add connection**
* Explain what dashboard will show after connecting

### Loading state

* Skeleton cards
* “Running checks…” status

### Blocked state

* Banner: “Blocked: X items prevent safe apply”
* Apply button disabled

### Warning state

* Apply allowed in Dev (soft gate)
* Apply gated in Prod (hard gate) if you choose environment policies

### Pass state

* “Ready” badge
* Apply enabled
* Suggest next actions: “Create new table”, “Open ERD”, “Start data entry”

---

## 7) Minimal Checklist-to-Dashboard Mapping (data contract)

The dashboard only needs this structure:

* Overall status + counts
* List of issues, each with:

  * `severity`
  * `section`
  * `scopeType`: `db|schema|table|relationship`
  * `objectRef` (schema.table.column)
  * `title`
  * `description`
  * `recommendedAction`
  * `deepLink` (where to jump)
  * `autoFixAvailable` boolean

---

If you want the next deliverable, say **“Binding rules”** and I’ll write Option 2: the exact rules for how checklist failures highlight **ERD nodes/edges** (badges, colors, hover tooltips, focus paths).
