# SQL Runner Implementation

## Overview
The SQL Runner is a critical component that enables safe execution of user-defined SQL checks against target databases. It provides template interpolation, security validation, and result mapping capabilities.

## Part 2.3: SQL Template Runner (Critical for Ship)

### Architecture

The SQL Runner consists of several modules working together:

1. **interpolate.ts** - Safe SQL template interpolation
2. **readonly.ts** - Read-only validation
3. **limits.ts** - Timeout and row cap enforcement
4. **mapping.ts** - Result mapping to TargetRef
5. **suggestMapping.ts** - Auto-suggest mapping from column names
6. **runSqlCheck.ts** - Main executor that orchestrates all modules

### 2.3.1: Safe SQL Interpolator (`interpolate.ts`)

```typescript
interpolateSql(template: string, vars: TemplateVars): string
```

**Features:**
- Supports placeholders: `{{schema}}`, `{{table}}`, `{{column}}`, `{{schemas}}`, `{{threshold.field}}`
- Array interpolation for schemas: `{{schemas}}` → `'public','auth'`
- Nested path access: `{{threshold.minRows}}` → `100`
- SQL injection prevention via string escaping
- Strict whitelist validation

**Example:**
```typescript
const sql = interpolateSql(
  'SELECT * FROM {{schema}}.{{table}} WHERE schema = ANY(ARRAY[{{schemas}}])',
  { schema: 'public', table: 'users', schemas: ['public', 'auth'] }
);
// Result: SELECT * FROM public.users WHERE schema = ANY(ARRAY['public','auth'])
```

### 2.3.2: SQL Guardrails (`readonly.ts`, `limits.ts`)

**Read-Only Validation:**
- Blocks: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, REVOKE, EXECUTE
- Allows: SELECT, WITH (CTEs), EXPLAIN
- Uses word boundary regex to prevent false positives

**Execution Limits:**
```typescript
executeWithLimits(pool: Pool, sql: string, opts: {
  timeoutMs: number;  // Default: 5000ms
  rowCap: number;     // Default: 100 rows
}): Promise<{ rows, fields, duration }>
```

**Features:**
- Sets PostgreSQL `statement_timeout` per session
- Caps result rows to prevent memory issues
- Returns execution duration for monitoring
- Automatically resets timeout after execution

### 2.3.3: Result Mapping (`mapping.ts`)

Maps SQL result rows to typed TargetRef objects for ERD integration:

**Supported Target Types:**
1. **Table**: `{ kind: 'table', schema, table }`
2. **Column**: `{ kind: 'column', schema, table, column }`
3. **Relationship**: `{ kind: 'relationship', childSchema, childTable, childCols, parentSchema, parentTable, parentCols, fkName }`
4. **Diagram**: `{ kind: 'diagram' }`

**Example Mapping Configuration:**
```json
{
  "targetKind": "column",
  "fields": {
    "schema": "schema_name",
    "table": "table_name",
    "column": "column_name"
  }
}
```

### 2.3.4: SQL Check Executor (`runSqlCheck.ts`)

Main function that orchestrates the entire check execution:

```typescript
runSqlCheck(
  targetPool: Pool,
  node: { sql_template, result_mapping, pass_fail_rule, severity },
  vars: TemplateVars
): Promise<SqlCheckResult>
```

**Execution Flow:**
1. Interpolate SQL template with variables
2. Validate read-only constraints
3. Execute with timeout and row cap
4. Map results to TargetRef objects
5. Evaluate pass/fail status based on rules
6. Return structured result

**Result Object:**
```typescript
{
  status: 'pass' | 'fail' | 'warning' | 'blocked',
  rowCount: number,
  targets: TargetRef[],
  outputRows: any[],
  duration: number,
  error?: string
}
```

**Pass/Fail Rules:**
- Default: 0 rows = pass, >0 rows = fail/warning/blocked based on severity
- `expectZero: false` inverts the logic (>0 rows = pass)
- Severity mapping:
  - `blocking` → status: `blocked`
  - `warning` → status: `warning`
  - `error` → status: `fail`

### 2.3.5: Integration with Checklist Runner

The SQL Runner is integrated into `checklist/runner.ts`:

```typescript
if (node.check_kind === 'SQL' && node.sql_template) {
  const result = await runSqlCheck(targetPool, node, {
    schemas: scopeRef.schemas,
    schema: scopeRef.schema,
    table: scopeRef.table,
  });
  
  // Store result in checklist_instance_results_v2
}
```

## Part 2.4: SQL Test Endpoint

**Endpoint:** `POST /api/v1/sql/test`

**Purpose:** Allows template builders to test SQL queries before saving them.

**Request:**
```json
{
  "targetDatabaseUrl": "postgresql://...",
  "sql": "SELECT schema, table FROM information_schema.tables",
  "rowCap": 25,
  "timeoutMs": 2500,
  "variables": {}
}
```

**Response:**
```json
{
  "rows": [...],
  "columns": [{ "name": "schema", "type": 1043 }],
  "mappingSuggestions": {
    "targetKind": "table",
    "fields": { "schema": "schema", "table": "table" }
  },
  "duration": 42
}
```

**Auto-Mapping Suggestions:**
- Detects table targets: `schema` + `table` columns
- Detects column targets: `schema` + `table` + `column` columns
- Detects relationship targets: `child_schema`, `parent_table`, etc.

## Security Considerations

1. **SQL Injection Prevention:** All placeholders are escaped using PostgreSQL-safe escaping
2. **Read-Only Enforcement:** Multiple layers of validation prevent write operations
3. **Resource Limits:** Timeout and row caps prevent DoS attacks
4. **Whitelist Placeholders:** Only specific variable names are allowed
5. **Error Handling:** Errors are caught and returned safely without exposing internals

## Testing

### Manual Tests
Run the SQL Runner test suite:
```bash
cd apps/api
npx tsx test-sqlrunner.ts
```

**Test Coverage:**
- ✅ Basic interpolation
- ✅ Array interpolation
- ✅ Nested path interpolation
- ✅ SQL injection prevention
- ✅ Invalid placeholder rejection
- ✅ Missing value detection
- ✅ SELECT query validation
- ✅ WITH/CTE validation
- ✅ INSERT/UPDATE/DELETE rejection
- ✅ DROP/CREATE rejection

### Integration Tests
Test the API endpoints:
```bash
cd apps/api
./test-api.sh
```

## Database Schema

New fields added in migration `016_add_missing_schema_fields.sql`:

```sql
-- checklist_templates_v2
ALTER TABLE checklist_templates_v2 
  ADD COLUMN tags jsonb,
  ADD COLUMN default_scope_type text,
  ADD COLUMN is_archived boolean DEFAULT false,
  ADD COLUMN updated_at timestamptz DEFAULT now();

-- checklist_template_versions_v2
ALTER TABLE checklist_template_versions_v2
  ADD COLUMN label text,
  ADD COLUMN notes text,
  ADD COLUMN published_by text;

-- checklist_instances_v2
ALTER TABLE checklist_instances_v2
  ADD COLUMN rollup jsonb;
```

## Usage Example

### Creating a SQL-Based Check Node

```typescript
// 1. Create a template node
POST /api/v1/checklist-template-versions/{versionId}/nodes
{
  "nodeType": "item",
  "title": "Tables Without Primary Keys",
  "checkKind": "SQL",
  "severity": "error",
  "sqlTemplate": `
    SELECT n.nspname AS schema, c.relname AS table
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = ANY(ARRAY[{{schemas}}])
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = c.oid AND contype = 'p'
      )
  `,
  "resultMapping": {
    "targetKind": "table",
    "fields": {
      "schema": "schema",
      "table": "table"
    }
  },
  "passFailRule": {
    "expectZero": true
  }
}

// 2. Run the check
POST /api/v1/checklist-instances/{instanceId}/run
{
  "targetDatabaseUrl": "postgresql://...",
  "schemas": ["public", "auth"],
  "mode": "all"
}

// 3. View issues
GET /api/v1/checklist-instances/{instanceId}/issues?severity=error
```

## Future Enhancements

1. **Variable Validation:** Pre-validate required variables before execution
2. **Query Explain:** Add EXPLAIN support for query optimization
3. **Rate Limiting:** Add per-user rate limits on SQL test endpoint
4. **Query Library:** Build a library of common check patterns
5. **Multi-Database Support:** Extend to MySQL, SQL Server, etc.
6. **Parameterized Queries:** Use PostgreSQL parameterized queries for better safety
