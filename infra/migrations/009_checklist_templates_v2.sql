-- Migration 009: Enhanced checklist templates
-- Creates a cleaner template structure with workspace scoping

CREATE TABLE IF NOT EXISTS checklist_templates_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS checklist_templates_v2_workspace_idx ON checklist_templates_v2(workspace_id);
