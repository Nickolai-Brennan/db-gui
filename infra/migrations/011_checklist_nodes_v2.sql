-- Migration 011: Enhanced checklist nodes with full configuration

CREATE TABLE IF NOT EXISTS checklist_nodes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid NOT NULL REFERENCES checklist_template_versions_v2(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES checklist_nodes_v2(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  node_type text NOT NULL CHECK (node_type IN ('group','item')),
  title text NOT NULL,
  description text,
  
  -- Item-specific fields
  item_type text CHECK (item_type IN ('manual','automatic','hybrid')),
  severity text CHECK (severity IN ('info','warning','error','blocking')),
  blocks_action boolean,
  required boolean,
  scope_type text CHECK (scope_type IN ('diagram','schema','table','column','relationship','migration_step')),
  target_selector jsonb,
  check_kind text,
  check_ref text,
  sql_template text,
  result_mapping jsonb,
  pass_fail_rule jsonb,
  fix_kind text CHECK (fix_kind IN ('none','manual','auto_sql')),
  fix_instructions text,
  fix_sql_template text,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checklist_nodes_v2_version_idx ON checklist_nodes_v2(template_version_id);
CREATE INDEX IF NOT EXISTS checklist_nodes_v2_parent_idx ON checklist_nodes_v2(parent_id);
CREATE INDEX IF NOT EXISTS checklist_nodes_v2_sort_idx ON checklist_nodes_v2(template_version_id, sort_order);
