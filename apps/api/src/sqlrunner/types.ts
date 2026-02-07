/**
 * SQL Runner Types
 */

export type TargetKind = 'table' | 'column' | 'relationship';

export interface TableTarget {
  kind: 'table';
  schema: string;
  table: string;
}

export interface ColumnTarget {
  kind: 'column';
  schema: string;
  table: string;
  column: string;
}

export interface RelationshipTarget {
  kind: 'relationship';
  childSchema: string;
  childTable: string;
  childCols: string[];
  parentSchema: string;
  parentTable: string;
  parentCols: string[];
}

export type TargetRef = TableTarget | ColumnTarget | RelationshipTarget;

export interface ResultMapping {
  targetKind: TargetKind;
  schemaCol?: string;
  tableCol?: string;
  columnCol?: string;
  childSchemaCol?: string;
  childTableCol?: string;
  childColsCol?: string;
  parentSchemaCol?: string;
  parentTableCol?: string;
  parentColsCol?: string;
}

export interface PassFailRule {
  type: 'rows_returned' | 'threshold';
  failIfGt?: number;
}

export type ResultStatus = 'pass' | 'fail' | 'warning' | 'blocked';

export interface CheckResult {
  status: ResultStatus;
  severity: string;
  targets: TargetRef[];
  outputRows: any[];
  outputStats: { rowCount: number };
  durationMs: number;
}
