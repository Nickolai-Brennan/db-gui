// Result mapping from SQL rows to TargetRef objects

export type TargetRef = {
  kind: 'table' | 'column' | 'relationship' | 'diagram';
  schema?: string;
  table?: string;
  column?: string;
  childSchema?: string;
  childTable?: string;
  childCols?: string[];
  parentSchema?: string;
  parentTable?: string;
  parentCols?: string[];
  fkName?: string;
};

export type ResultMapping = {
  targetKind: 'table' | 'column' | 'relationship' | 'diagram';
  fields: Record<string, string>; // resultCol -> targetField
};
/**
 * Result Mapping
 * Map SQL result rows to target_ref objects
 */

import type { ResultMapping, TargetRef } from './types';

export function mapRowsToTargets(
  rows: any[],
  mapping: ResultMapping
): TargetRef[] {
  return rows.map(row => {
    if (mapping.targetKind === 'table') {
      return {
        kind: 'table',
        schema: row[mapping.fields.schema],
        table: row[mapping.fields.table],
      };
    }
    
    if (mapping.targetKind === 'column') {
      return {
        kind: 'column',
        schema: row[mapping.fields.schema],
        table: row[mapping.fields.table],
        column: row[mapping.fields.column],
      };
    }
    
    if (mapping.targetKind === 'relationship') {
      return {
        kind: 'relationship',
        childSchema: row[mapping.fields.childSchema],
        childTable: row[mapping.fields.childTable],
        childCols: parseArray(row[mapping.fields.childCols]),
        parentSchema: row[mapping.fields.parentSchema],
        parentTable: row[mapping.fields.parentTable],
        parentCols: parseArray(row[mapping.fields.parentCols]),
        fkName: row[mapping.fields.fkName],
      };
    }
    
    return { kind: 'diagram' };
  });
}

function parseArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim());
  return [];
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
