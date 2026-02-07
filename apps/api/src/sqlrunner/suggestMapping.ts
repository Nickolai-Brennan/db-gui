/**
 * SQL Mapping Suggestion Heuristics
 * Suggest result mappings based on column names
 */

import type { ResultMapping } from './types';

export function suggestMapping(columns: string[]): ResultMapping | null {
  const lc = columns.map(c => c.toLowerCase());
  
  // Table target
  if (lc.includes('schema') && lc.includes('table')) {
    return {
      targetKind: 'table',
      schemaCol: columns[lc.indexOf('schema')],
      tableCol: columns[lc.indexOf('table')],
    };
  }
  
  // Column target
  if (lc.includes('schema') && lc.includes('table') && lc.includes('column')) {
    return {
      targetKind: 'column',
      schemaCol: columns[lc.indexOf('schema')],
      tableCol: columns[lc.indexOf('table')],
      columnCol: columns[lc.indexOf('column')],
    };
  }
  
  // Relationship target
  const relCols = ['child_schema', 'child_table', 'parent_schema', 'parent_table'];
  if (relCols.every(c => lc.includes(c))) {
    return {
      targetKind: 'relationship',
      childSchemaCol: columns[lc.indexOf('child_schema')],
      childTableCol: columns[lc.indexOf('child_table')],
      childColsCol: lc.includes('child_cols') ? columns[lc.indexOf('child_cols')] : undefined,
      parentSchemaCol: columns[lc.indexOf('parent_schema')],
      parentTableCol: columns[lc.indexOf('parent_table')],
      parentColsCol: lc.includes('parent_cols') ? columns[lc.indexOf('parent_cols')] : undefined,
    };
  }
  
  return null;
}
