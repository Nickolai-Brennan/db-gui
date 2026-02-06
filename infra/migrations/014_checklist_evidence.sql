-- Migration 014: Evidence attachments for checklist results

CREATE TABLE IF NOT EXISTS checklist_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES checklist_instance_results_v2(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('note','file','link','sql')),
  label text,
  uri text,
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checklist_evidence_result_idx ON checklist_evidence(result_id);
