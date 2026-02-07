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
}
