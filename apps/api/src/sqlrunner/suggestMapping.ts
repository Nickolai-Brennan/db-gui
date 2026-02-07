// Auto-suggest result mapping based on column names

export type MappingSuggestion = {
  targetKind: 'table' | 'column' | 'relationship';
  fields: Record<string, string>;
} | null;

export function suggestMapping(columns: { name: string }[]): MappingSuggestion {
  const names = columns.map(c => c.name.toLowerCase());
  
  // Table target
  if (names.includes('schema') && names.includes('table')) {
    return {
      targetKind: 'table',
      fields: {
        schema: 'schema',
        table: 'table',
      },
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
  if (names.includes('schema') && names.includes('table') && names.includes('column')) {
    return {
      targetKind: 'column',
      fields: {
        schema: 'schema',
        table: 'table',
        column: 'column',
      },
  if (lc.includes('schema') && lc.includes('table') && lc.includes('column')) {
    return {
      targetKind: 'column',
      schemaCol: columns[lc.indexOf('schema')],
      tableCol: columns[lc.indexOf('table')],
      columnCol: columns[lc.indexOf('column')],
    };
  }
  
  // Relationship target
  if (names.includes('child_schema') && names.includes('parent_table')) {
    return {
      targetKind: 'relationship',
      fields: {
        childSchema: 'child_schema',
        childTable: 'child_table',
        childCols: 'child_cols',
        parentSchema: 'parent_schema',
        parentTable: 'parent_table',
        parentCols: 'parent_cols',
        fkName: 'fk_name',
      },
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
