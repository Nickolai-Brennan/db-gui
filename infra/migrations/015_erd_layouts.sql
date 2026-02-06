-- Migration 015: ERD layout persistence

CREATE TABLE IF NOT EXISTS erd_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  layout jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id)
);

CREATE INDEX IF NOT EXISTS erd_layouts_instance_idx ON erd_layouts(instance_id);
