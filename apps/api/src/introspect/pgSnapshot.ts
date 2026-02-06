import type { Pool } from 'pg';
import { createTargetPool } from '../targetDb';
import {
  qTables, qColumns, qPrimaryKeys, qUniqueConstraints, qForeignKeys, qIndexes
} from './pgQueries';
import { fkAction } from './pgMaps';
import type { PgSnapshot } from './types';

export async function getPgSnapshot(targetDatabaseUrl: string, schemas: string[]): Promise<PgSnapshot> {
  const pool: Pool = createTargetPool(targetDatabaseUrl);

  try {
    const [tables, columns, pks, uniques, fksRaw, indexes] = await Promise.all([
      pool.query(qTables, [schemas]),
      pool.query(qColumns, [schemas]),
      pool.query(qPrimaryKeys, [schemas]),
      pool.query(qUniqueConstraints, [schemas]),
      pool.query(qForeignKeys, [schemas]),
      pool.query(qIndexes, [schemas]),
    ]);

    const foreignKeys = fksRaw.rows.map((r: any) => ({
      name: r.name,
      childSchema: r.child_schema,
      childTable: r.child_table,
      childCols: r.child_cols,
      parentSchema: r.parent_schema,
      parentTable: r.parent_table,
      parentCols: r.parent_cols,
      onDelete: fkAction(r.on_delete_code),
      onUpdate: fkAction(r.on_update_code),
      deferrable: r.deferrable,
      initiallyDeferred: r.initially_deferred,
    }));

    return {
      generatedAt: new Date().toISOString(),
      schemas,
      tables: tables.rows.map((r: any) => ({
        schema: r.schema,
        name: r.name,
        oid: Number(r.oid),
        kind: r.kind,
        rowEstimate: r.row_estimate != null ? Number(r.row_estimate) : null,
        totalBytes: r.total_bytes != null ? Number(r.total_bytes) : null,
        tableBytes: r.table_bytes != null ? Number(r.table_bytes) : null,
        indexBytes: r.index_bytes != null ? Number(r.index_bytes) : null,
      })),
      columns: columns.rows.map((r: any) => ({
        schema: r.schema,
        table: r.table,
        name: r.name,
        ordinal: Number(r.ordinal),
        dataType: r.data_type,
        isNullable: Boolean(r.is_nullable),
        defaultExpr: r.default_expr ?? null,
        isIdentity: Boolean(r.is_identity),
      })),
      primaryKeys: pks.rows.map((r: any) => ({
        schema: r.schema,
        table: r.table,
        name: r.name,
        columns: r.columns,
      })),
      uniqueConstraints: uniques.rows.map((r: any) => ({
        schema: r.schema,
        table: r.table,
        name: r.name,
        columns: r.columns,
        isPrimary: Boolean(r.is_primary),
      })),
      foreignKeys,
      indexes: indexes.rows.map((r: any) => ({
        schema: r.schema,
        table: r.table,
        name: r.name,
        method: r.method,
        isUnique: Boolean(r.is_unique),
        isPrimary: Boolean(r.is_primary),
        isValid: Boolean(r.is_valid),
        columns: r.columns ?? [],
        predicate: r.predicate ?? null,
        definition: r.definition,
      })),
    };
  } finally {
    await pool.end().catch(() => {});
  }
}
