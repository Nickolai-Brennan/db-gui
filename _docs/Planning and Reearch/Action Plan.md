## Product Identity (lock this in)

**Primary focus**

* ERD (Entity Relationship Diagrams)
* Schema design & evolution
* Data entry & table-level CRUD
* Relationship-aware editing
* Clean, modern visual modeling

**Secondary**

* SQL editor (generated + advanced users)
* Query execution (supporting, not dominant)
* Explain / validate (optional later)

Think:

> **“Figma for databases”**
> not
> “IDE for SQL power users”

---

## Why this is a smart move (market reality)

Most tools today:

* Treat ERDs as **secondary** (DBeaver, DataGrip)
* Treat data entry as **raw tables** (ugly grids)
* Treat schema changes as **manual SQL**

There is **no dominant modern ERD-first database tool** with:

* live DB sync
* clean UI
* relationship-aware data entry
* safe schema evolution

That’s your wedge.

---

## Core Product Pillars (v1)

### 🧠 Pillar 1 — ERD is the main workspace

The ERD **is the dashboard**, not a side tab.

**Capabilities**

* Auto-generate ERD from existing DB
* Manual ERD creation (new projects)
* Drag entities, resize, group
* Clear PK/FK visuals
* Cardinality shown clearly
* Highlight:

  * missing FKs
  * orphan tables
  * many-to-many join tables

**Interaction rules**

* Click table → opens inspector
* Click relationship → opens FK editor
* Hover highlights join paths
* Right-click canvas → add entity

**This screen should feel calm, spacious, intentional**

---

### 🧱 Pillar 2 — Schema Builder (no SQL required)

Schema changes happen **visually first**, SQL second.

**Table editor**

* Add / remove columns
* Types with validation
* Defaults, nullability
* Index + constraint builder
* FK builder with visual picker

**Output**

* Generated SQL (dialect-aware)
* Migration preview
* “Apply changes” (safe mode)

This replaces:

```sql
ALTER TABLE ...
```

with **confidence + clarity**

---

### ✍️ Pillar 3 — Relationship-Aware Data Entry

This is where you *differentiate hard*.

**Data Entry View**

* Parent → child navigation
* Inline FK selectors (dropdowns, search)
* Related records visible side-by-side
* Add/edit rows with form view (not raw grid only)

Example:

* Click `orders`
* Right panel shows:

  * customer (linked)
  * order_items (inline table)
  * payments (tab)

**This makes databases usable for humans.**

---

### 🔍 Pillar 4 — Object Inspector (contextual)

Right sidebar that adapts based on selection.

**For a table**

* Overview (rows, size)
* Columns
* Relationships
* Indexes
* Sample data
* Generated SQL (collapsed)

**For a relationship**

* FK definition
* On delete / update rules
* Cardinality
* Data integrity warnings

---

## SQL’s role (important, but not dominant)

SQL exists in **three places only**:

1. **Generated SQL panel**

   * Read-only by default
   * Editable for advanced users

2. **Advanced Query tab**

   * For power users
   * Same results grid as data entry

3. **Explain / Validate (later)**

   * Supporting trust
   * Not the main UI

> Users should succeed *without ever writing SQL*

---

## What we explicitly DO NOT build (for now)

❌ Low-code app builder (UI Bakery territory)
❌ Workflow automation
❌ Heavy AI dependency
❌ IDE-style cluttered SQL panels
❌ “Everything tool” syndrome

This keeps the product **focused and elegant**.

---

## v1 Navigation Structure

```
▸ ERD (default)
▸ Tables
▸ Data
▸ SQL (advanced)
▸ Migrations
▸ Settings
```

ERD opens by default every time.

---

## Technical Architecture (supports ERD-first)

* **Metadata engine**

  * tables, columns, PK/FK, indexes
* **Diagram state**

  * layout stored separately from DB
* **Schema diff engine**

  * visual → SQL migration
* **Safe apply**

  * preview + confirm
* **Data editor**

  * FK-aware forms
  * pagination, limits, guards

---

## Competitive Positioning (simple and strong)

| Tool          | ERD-first | Data Entry UX | Modern UI |
| ------------- | --------- | ------------- | --------- |
| DBeaver       | ❌         | ❌             | ❌         |
| DataGrip      | ❌         | ❌             | ❌         |
| Navicat       | ⚠️        | ⚠️            | ❌         |
| UI Bakery     | ❌         | ✅             | ✅         |
| **Your Tool** | ✅         | ✅             | ✅         |

You’re carving out **a real gap**.

---

## The correct next step (no ambiguity)

### I recommend we do this next:

👉 **Design the ERD Workspace in detail**

Specifically:

* Canvas behavior
* Node layout rules
* Relationship rendering
* Inspector states
* Keyboard + mouse interactions

If you want, next I will:

1. Define **ERD canvas UX spec**
2. Define **table/relationship data models**
3. Define **schema → SQL diff rules**

Just say **“ERD spec”** and we’ll go deep.

