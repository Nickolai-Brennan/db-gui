-- Migration 010: Template versions with publishing workflow

CREATE TABLE IF NOT EXISTS checklist_template_versions_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES checklist_templates_v2(id) ON DELETE CASCADE,
  version text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','published','archived')),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (template_id, version)
);

CREATE INDEX IF NOT EXISTS checklist_template_versions_v2_template_idx ON checklist_template_versions_v2(template_id);
CREATE INDEX IF NOT EXISTS checklist_template_versions_v2_status_idx ON checklist_template_versions_v2(status);
