-- Migration 013: Enhanced instance results with detailed execution data

CREATE TABLE IF NOT EXISTS checklist_instance_results_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES checklist_instances_v2(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES checklist_nodes_v2(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('unchecked','pass','warning','fail','blocked')),
  severity text NOT NULL CHECK (severity IN ('info','warning','error','blocking')),
  target_ref jsonb,
  run_type text NOT NULL CHECK (run_type IN ('manual','automatic','hybrid')),
  ran_at timestamptz,
  duration_ms integer,
  output_summary text,
  output_rows jsonb,
  output_stats jsonb,
  note text,
  checked_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, node_id)
);

CREATE INDEX IF NOT EXISTS checklist_instance_results_v2_instance_idx ON checklist_instance_results_v2(instance_id);
CREATE INDEX IF NOT EXISTS checklist_instance_results_v2_status_idx ON checklist_instance_results_v2(status);
CREATE INDEX IF NOT EXISTS checklist_instance_results_v2_severity_idx ON checklist_instance_results_v2(severity);
