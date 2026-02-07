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
    };
  }
  
  return null;
}
