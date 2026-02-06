# DB-GUI API

Backend API for the DB-GUI database health and ERD management tool.

## Architecture

The API is built with Fastify and provides endpoints for:

1. **Postgres Introspection** - Full schema snapshot API for ERD rendering
2. **Checklist Execution** - Run automatic checks on target databases
3. **ERD Annotations** - Get issue overlays for ERD visualization

## Directory Structure

```
src/
├── checks/              # Built-in database checks
│   ├── noPrimaryKey.ts       # Detect tables without primary keys
│   ├── fkMeta.ts             # FK metadata helper
│   ├── fkNotIndexed.ts       # Detect unindexed foreign keys
│   └── fkHasViolations.ts    # Detect FK constraint violations
├── checklist/           # Checklist runner logic
│   ├── runner.ts             # Execute checks and store results
│   ├── ensureResults.ts      # Ensure result rows exist
│   └── rollup.ts             # Compute rollup status
├── introspect/          # Database introspection
│   ├── types.ts              # PgSnapshot, PgTable, etc
│   ├── pgQueries.ts          # SQL queries for introspection
│   ├── pgMaps.ts             # Map query results to types
│   └── pgSnapshot.ts         # Snapshot service
├── routes/              # API endpoints
│   ├── instances.ts          # Checklist instance routes
│   ├── annotations.ts        # ERD annotations endpoint
│   └── introspect.ts         # Introspection endpoints
├── db.ts                # App database client (pg Pool)
├── sql.ts               # SQL helper utilities
├── targetDb.ts          # Target database client factory
├── types.ts             # Shared API types
└── index.ts             # Main application entry point
```

## API Endpoints

### Introspection

#### `POST /api/v1/introspect/postgres/snapshot`

Get a complete snapshot of database schema for ERD rendering.

**Request:**
```json
{
  "targetDatabaseUrl": "postgresql://user:pass@localhost:5432/mydb",
  "schemas": ["public", "analytics"]
}
```

**Response:**
```json
{
  "snapshot": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "schemas": ["public"],
    "tables": [...],
    "columns": [...],
    "primaryKeys": [...],
    "uniqueConstraints": [...],
    "foreignKeys": [...],
    "indexes": [...]
  }
}
```

#### `POST /api/v1/introspect/postgres/table-detail`

Get detailed information for a specific table.

**Request:**
```json
{
  "targetDatabaseUrl": "postgresql://user:pass@localhost:5432/mydb",
  "schema": "public",
  "table": "users"
}
```

### Checklist Execution

#### `POST /api/v1/checklist-instances/:instanceId/run`

Run checks for a checklist instance.

**Request:**
```json
{
  "targetDatabaseUrl": "postgresql://user:pass@localhost:5432/mydb",
  "schemas": ["public"],
  "mode": "all",
  "nodeIds": []  // optional: specific checks to run
}
```

**Response:**
```json
{
  "ok": true,
  "rollup": {
    "totalItems": 10,
    "blockedCount": 0,
    "failCount": 2,
    "warningCount": 3,
    "passCount": 5,
    "uncheckedCount": 0
  }
}
```

### Annotations

#### `GET /api/v1/checklist-instances/:instanceId/annotations`

Get ERD overlay annotations (issue badges and relationship highlights).

**Response:**
```json
{
  "instanceId": "uuid",
  "tables": [
    {
      "schema": "public",
      "table": "users",
      "severity": "error",
      "count": 2
    }
  ],
  "relationships": [
    {
      "childSchema": "public",
      "childTable": "orders",
      "childCols": ["user_id"],
      "parentSchema": "public",
      "parentTable": "users",
      "parentCols": ["id"],
      "fkName": "orders_user_id_fkey",
      "severity": "warning",
      "count": 1
    }
  ]
}
```

## Built-in Checks

### NO_PRIMARY_KEY

Detects tables without primary keys.

**Target:** Tables  
**Severity:** Error/Warning (configurable)

### FK_NOT_INDEXED

Detects foreign keys that lack supporting indexes on child table columns.

**Target:** Relationships  
**Severity:** Warning (configurable)

### FK_HAS_VIOLATIONS

Detects foreign key constraints with orphaned rows (referential integrity violations).

**Target:** Relationships  
**Severity:** Blocking/Error (configurable)

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbgui_app
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Type check
pnpm typecheck

# Build
pnpm build
```

## Database Schema

The API expects the app database schema to be initialized with migrations in `/infra/migrations/`:

- `001_initial_schema.sql` - Core tables
- `002_align_schema.sql` - Schema alignment for checklist runner

## Security Notes

**v1 Approach:** The `targetDatabaseUrl` is passed in request bodies. This is for rapid development only.

**Future:** Use encrypted connection storage with `connectionId` references instead of passing credentials in requests.
