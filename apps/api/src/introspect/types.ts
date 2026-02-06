export type PgSnapshot = {
  generatedAt: string;
  schemas: string[];

  tables: PgTable[];
  columns: PgColumn[];
  primaryKeys: PgPrimaryKey[];
  uniqueConstraints: PgUniqueConstraint[];
  foreignKeys: PgForeignKey[];
  indexes: PgIndex[];
};

export type PgTable = {
  schema: string;
  name: string;
  oid: number;
  kind: "table" | "partitioned_table";
  rowEstimate: number | null;
  totalBytes: number | null;
  tableBytes: number | null;
  indexBytes: number | null;
};

export type PgColumn = {
  schema: string;
  table: string;
  name: string;
  ordinal: number;
  dataType: string;
  isNullable: boolean;
  defaultExpr: string | null;
  isIdentity: boolean;
};

export type PgPrimaryKey = {
  schema: string;
  table: string;
  name: string;
  columns: string[];
};

export type PgUniqueConstraint = {
  schema: string;
  table: string;
  name: string;
  columns: string[];
  isPrimary: boolean;
};

export type PgForeignKey = {
  name: string;
  childSchema: string;
  childTable: string;
  childCols: string[];
  parentSchema: string;
  parentTable: string;
  parentCols: string[];
  onDelete: string;
  onUpdate: string;
  deferrable: boolean;
  initiallyDeferred: boolean;
};

export type PgIndex = {
  schema: string;
  table: string;
  name: string;
  method: string;
  isUnique: boolean;
  isPrimary: boolean;
  isValid: boolean;
  columns: string[];
  predicate: string | null;
  definition: string;
};
