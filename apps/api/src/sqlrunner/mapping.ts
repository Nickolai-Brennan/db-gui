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
      targets.push({
        kind: 'relationship',
        childSchema: row[mapping.childSchemaCol!],
        childTable: row[mapping.childTableCol!],
        childCols: JSON.parse(row[mapping.childColsCol!]),
        parentSchema: row[mapping.parentSchemaCol!],
        parentTable: row[mapping.parentTableCol!],
        parentCols: JSON.parse(row[mapping.parentColsCol!]),
      });
    }
  }
  
  return targets;
}
