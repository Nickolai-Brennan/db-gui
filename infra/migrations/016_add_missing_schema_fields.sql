-- Migration 016: Add missing fields for enhanced features
-- Part 1: Add fields to checklist_templates_v2

ALTER TABLE checklist_templates_v2 
  ADD COLUMN IF NOT EXISTS tags jsonb,
  ADD COLUMN IF NOT EXISTS default_scope_type text,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Part 2: Add fields to checklist_template_versions_v2

ALTER TABLE checklist_template_versions_v2
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_by text;

-- Part 3: Add rollup field to checklist_instances_v2

ALTER TABLE checklist_instances_v2
  ADD COLUMN IF NOT EXISTS rollup jsonb;

-- Note: blocks_action and required already exist in checklist_nodes_v2
