-- Migration to align schema with checklist runner requirements

-- Update checklist_instances to support rollup status
ALTER TABLE checklist_instances 
  DROP CONSTRAINT IF EXISTS checklist_instances_status_check;

ALTER TABLE checklist_instances 
  ADD CONSTRAINT checklist_instances_status_check 
  CHECK (status IN ('pending','running','completed','failed','incomplete','pass','warning','fail','blocked'));

ALTER TABLE checklist_instances
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz;

-- Update checklist_instance_results to support new status values and fields
ALTER TABLE checklist_instance_results
  DROP CONSTRAINT IF EXISTS checklist_instance_results_status_check;

ALTER TABLE checklist_instance_results
  ADD CONSTRAINT checklist_instance_results_status_check
  CHECK (status IN ('pass','fail','warning','skip','error','unchecked','blocked'));

-- Add severity column if it doesn't exist
ALTER TABLE checklist_instance_results
  ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('error','warning','info','blocking'));

-- Add run_type column if it doesn't exist  
ALTER TABLE checklist_instance_results
  ADD COLUMN IF NOT EXISTS run_type text CHECK (run_type IN ('manual','automatic','hybrid'));

-- Update checklist_nodes to support check_code (for built-in checks)
-- The check_code field already exists, just ensure it's nullable
