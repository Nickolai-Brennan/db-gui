// Core shared types for db-gui

// Database dialects
export type Dialect = "postgres" | "mysql" | "sqlite" | "mssql";

// Severity levels for checks
export type Severity = "error" | "warning" | "info";

// Node types in checklist tree
export type NodeType = "check" | "group" | "category";

// Item types for checklist items
export type ItemType = "table" | "column" | "constraint" | "index" | "schema";

// Scope for checks
export type ScopeType = "database" | "schema" | "table" | "column";

// Result status for check execution
export type ResultStatus = "pass" | "fail" | "warning" | "skip" | "error";

// Instance status for checklist runs
export type InstanceStatus = "pending" | "running" | "completed" | "failed";

// Target reference for binding checks to database objects
export type TargetRef = {
  type: ItemType;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
  index?: string;
};

// Issue row representing a single check failure
export type IssueRow = {
  id: string;
  checkCode: string;
  severity: Severity;
  target: TargetRef;
  message: string;
  details?: Record<string, unknown>;
  resultStatus: ResultStatus;
};

// Workspace for organizing connections
export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Database connection definition
export type Connection = {
  id: string;
  workspaceId: string;
  name: string;
  dialect: Dialect;
  host: string;
  port: number;
  database: string;
  username: string;
  // password stored encrypted
  createdAt: string;
  updatedAt: string;
};

// Checklist template
export type ChecklistTemplate = {
  id: string;
  name: string;
  description: string;
  dialect: Dialect;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
};

// Checklist template version
export type ChecklistTemplateVersion = {
  id: string;
  templateId: string;
  version: number;
  definition: Record<string, unknown>;
  createdAt: string;
};

// Checklist node in the tree structure
export type ChecklistNode = {
  id: string;
  versionId: string;
  parentId: string | null;
  nodeType: NodeType;
  checkCode: string | null;
  label: string;
  description: string | null;
  severity: Severity | null;
  ordinal: number;
};

// Checklist instance (a run)
export type ChecklistInstance = {
  id: string;
  connectionId: string;
  templateVersionId: string;
  status: InstanceStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

// Result for a single check in an instance
export type ChecklistInstanceResult = {
  id: string;
  instanceId: string;
  nodeId: string;
  status: ResultStatus;
  issueCount: number;
  passCount: number;
  output: Record<string, unknown> | null;
  executedAt: string;
};
