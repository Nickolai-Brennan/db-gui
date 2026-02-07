-- Migration 016: Add template fields for enhanced metadata and archival

ALTER TABLE checklist_templates_v2
ADD COLUMN IF NOT EXISTS tags jsonb,
ADD COLUMN IF NOT EXISTS default_scope_type text,
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE checklist_template_versions_v2
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS published_by text;
