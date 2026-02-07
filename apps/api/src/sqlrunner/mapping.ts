/**
 * Result Mapping
 * Map SQL result rows to target_ref objects
 */

import type { ResultMapping, TargetRef } from './types';

export function mapRowsToTargets(
  rows: any[],
  mapping: ResultMapping
): TargetRef[] {
  const targets: TargetRef[] = [];
  
  for (const row of rows) {
    try {
      if (mapping.targetKind === 'table' && mapping.schemaCol && mapping.tableCol) {
        targets.push({
          kind: 'table',
          schema: row[mapping.schemaCol],
          table: row[mapping.tableCol],
        });
      } else if (mapping.targetKind === 'column' && mapping.schemaCol && mapping.tableCol && mapping.columnCol) {
        targets.push({
          kind: 'column',
          schema: row[mapping.schemaCol],
          table: row[mapping.tableCol],
          column: row[mapping.columnCol],
        });
      } else if (mapping.targetKind === 'relationship') {
        // Parse JSON columns with error handling
        const childCols = mapping.childColsCol 
          ? safeJsonParse(row[mapping.childColsCol], mapping.childColsCol)
          : [];
        const parentCols = mapping.parentColsCol 
          ? safeJsonParse(row[mapping.parentColsCol], mapping.parentColsCol)
          : [];
          
        targets.push({
          kind: 'relationship',
          childSchema: row[mapping.childSchemaCol!],
          childTable: row[mapping.childTableCol!],
          childCols,
          parentSchema: row[mapping.parentSchemaCol!],
          parentTable: row[mapping.parentTableCol!],
          parentCols,
        });
      }
    } catch (err: any) {
      throw new Error(`Failed to map row to target: ${err.message}`);
    }
  }
  
  return targets;
}

function safeJsonParse(value: any, columnName: string): any {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (err) {
    throw new Error(`Invalid JSON in column ${columnName}: ${value}`);
  }
}
