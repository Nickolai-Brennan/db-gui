-- Migration 012: Enhanced checklist instances with rollup status

CREATE TABLE IF NOT EXISTS checklist_instances_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES connections(id) ON DELETE SET NULL,
  template_version_id uuid NOT NULL REFERENCES checklist_template_versions_v2(id),
  scope_type text NOT NULL CHECK (scope_type IN ('diagram','schema','table','migration_step')),
  scope_ref jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('incomplete','pass','warning','fail','blocked')),
  blocking_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz
);

CREATE INDEX IF NOT EXISTS checklist_instances_v2_workspace_idx ON checklist_instances_v2(workspace_id);
CREATE INDEX IF NOT EXISTS checklist_instances_v2_template_version_idx ON checklist_instances_v2(template_version_id);
CREATE INDEX IF NOT EXISTS checklist_instances_v2_status_idx ON checklist_instances_v2(status);
