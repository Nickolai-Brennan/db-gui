Below is a **Tech Stack + Dependencies Install Doc** you can drop into your repo as `README_DEV_SETUP.md` (or `docs/INSTALL.md`).

---

# SQL GUI + ERD Dashboard — Tech Stack & Install Guide

## 1) Tech Stack

### Frontend (Web App)

* **React + TypeScript**
* **Vite** (dev server + build)
* **Tailwind CSS** (UI styling)
* **TanStack Query** (API fetching/caching)
* **Zustand** (ERD canvas + UI state)
* **React Router** (routing)

**Core UI modules**

* ERD Canvas (pan/zoom/drag, edges, minimap, schema lanes)
* Inspector Panel (table/relationship details)
* Issues Drawer (filters + jump-to-focus)
* SQL Builder (test SQL + mapping suggestion)

---

### Backend (API Server)

* **Node.js + TypeScript**
* **Fastify** (HTTP server)
* **Zod** (request validation)
* **pg** (PostgreSQL driver)

**Backend responsibilities**

* Templates/versions/nodes CRUD
* Instances + results + issues queue
* Runner (built-in checks + SQL checks runtime)
* SQL test endpoint (`POST /api/v1/sql/test`)
* ERD layout persistence (`GET/PUT /erd-layout`)
* Postgres introspection snapshot (ERD graph)

---

### Databases

* **App DB (PostgreSQL)**: stores workspaces, templates, versions, nodes, instances, results, layouts
* **Target DB (PostgreSQL / others later)**: user database being introspected + tested

> v1 accepts `targetDatabaseUrl` directly for dev. Production should use `connectionId` + server-side secrets.

---

## 2) Repo Layout (recommended)

```
repo/
  apps/
    api/        # Fastify server
    web/        # React UI
  packages/
    shared/     # shared types/utils (optional)
  db/
    migrations/ # SQL migrations for App DB
  .env.example
  README_DEV_SETUP.md
```

---

## 3) Prerequisites

### Required

* **Node.js 20+**
* **pnpm 9+**
* **PostgreSQL 15+** (for App DB)
* (Optional) A **Target Postgres DB** to test introspection/SQL runner

### Verify

```bash
node -v
pnpm -v
psql --version
```

---

## 4) Install Dependencies

### 4.1 Install pnpm (if needed)

```bash
npm i -g pnpm
```

### 4.2 Install workspace deps

From repo root:

```bash
pnpm install
```

---

## 5) Environment Variables

Create `.env` at repo root (or per app).

### 5.1 App DB (required)

```bash
APP_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sql_gui_app
```

### 5.2 API server config (recommended)

```bash
API_PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### 5.3 Target DB (dev convenience)

For dev you can keep a default target URL:

```bash
DEFAULT_TARGET_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/target_db
```

> Your endpoints also accept `targetDatabaseUrl` in request bodies for now.

---

## 6) Create the App Database + Run Migrations

### 6.1 Create DB

```bash
createdb sql_gui_app
# or:
psql -U postgres -c "CREATE DATABASE sql_gui_app;"
```

### 6.2 Run migrations

If you’re using plain SQL migrations in `db/migrations/*.sql`, simplest is a tiny migration runner.
Two options:

#### Option A (recommended): node-pg-migrate

Install:

```bash
pnpm --filter api add node-pg-migrate
```

Add scripts (in `apps/api/package.json`):

```json
{
  "scripts": {
    "migrate:up": "node-pg-migrate up -d \"${APP_DATABASE_URL}\" -m ../../db/migrations",
    "migrate:down": "node-pg-migrate down -d \"${APP_DATABASE_URL}\" -m ../../db/migrations"
  }
}
```

Run:

```bash
pnpm --filter api run migrate:up
```

#### Option B: manual (small projects)

Run SQL files in order:

```bash
psql "$APP_DATABASE_URL" -f db/migrations/001_init.sql
psql "$APP_DATABASE_URL" -f db/migrations/008_erd_layouts.sql
```

---

## 7) Run the Apps (Dev)

### 7.1 Start API

```bash
pnpm --filter api dev
```

Example `apps/api/package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  }
}
```

### 7.2 Start Web

```bash
pnpm --filter web dev
```

Example `apps/web/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Default URLs:

* Web: `http://localhost:5173`
* API: `http://localhost:4000`

---

## 8) Dependencies List (by app)

### 8.1 API dependencies

Install:

```bash
pnpm --filter api add fastify @fastify/sensible zod pg
pnpm --filter api add -D typescript tsx @types/node
```

Optional (recommended):

```bash
pnpm --filter api add fastify-plugin
```

### 8.2 Web dependencies

Install:

```bash
pnpm --filter web add react react-dom react-router-dom zustand @tanstack/react-query
pnpm --filter web add -D typescript vite @types/react @types/react-dom tailwindcss postcss autoprefixer
```

Initialize Tailwind (in `apps/web`):

```bash
pnpm --filter web exec tailwindcss init -p
```

---

## 9) Quick Health Checks

### 9.1 API up?

```bash
curl http://localhost:4000/health
```

### 9.2 SQL test endpoint

```bash
curl -X POST http://localhost:4000/api/v1/sql/test \
  -H "Content-Type: application/json" \
  -d '{
    "targetDatabaseUrl":"'"$DEFAULT_TARGET_DATABASE_URL"'",
    "sql":"SELECT 1 as ok",
    "rowCap": 5,
    "timeoutMs": 1500
  }'
```

Expected: `rows: [{ ok: 1 }]`

### 9.3 ERD layout endpoints

```bash
curl http://localhost:4000/api/v1/checklist-instances/<INSTANCE_ID>/erd-layout
```

---

## 10) Production Notes (do this before real users)

* Do **not** accept raw `targetDatabaseUrl` from the browser

  * store connections in App DB and resolve server-side
* Add auth (JWT/session) + workspace access checks
* Add rate limits for SQL test + runner
* Add query allowlist or stronger SQL parser enforcement for “read-only” routes

---

If you want, I can also generate:

* a **root `package.json`** for a pnpm monorepo
* `apps/api/src/index.ts` + `db.ts` boilerplate
* a **migrations baseline** (001_init.sql) matching the tables we’ve designed so far
