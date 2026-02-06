-- Initial schema for db-gui app database

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Workspaces
CREATE TABLE workspaces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 2) Connections (target databases)
CREATE TABLE connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  dialect       text NOT NULL CHECK (dialect IN ('postgres','mysql','mssql','sqlite')),
  host          text,
  port          integer,
  database_name text,
  username      text,
  password_encrypted text, -- encrypted connection string for v2
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX connections_workspace_idx ON connections(workspace_id);

-- 3) Checklist Templates
CREATE TABLE checklist_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  dialect       text NOT NULL CHECK (dialect IN ('postgres','mysql','mssql','sqlite')),
  is_built_in   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 4) Template Versions
CREATE TABLE checklist_template_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  definition     jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

CREATE INDEX checklist_template_versions_template_idx ON checklist_template_versions(template_id);

-- 5) Template Nodes (tree structure)
CREATE TABLE checklist_nodes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id         uuid NOT NULL REFERENCES checklist_template_versions(id) ON DELETE CASCADE,
  parent_id          uuid REFERENCES checklist_nodes(id) ON DELETE CASCADE,
  node_type          text NOT NULL CHECK (node_type IN ('check','group','category')),
  check_code         text,
  label              text NOT NULL,
  description        text,
  severity           text CHECK (severity IN ('error','warning','info')),
  ordinal            integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checklist_nodes_version_idx ON checklist_nodes(version_id);
CREATE INDEX checklist_nodes_parent_idx ON checklist_nodes(parent_id);

-- 6) Checklist Instances (runs)
CREATE TABLE checklist_instances (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id        uuid REFERENCES connections(id) ON DELETE SET NULL,
  template_version_id  uuid NOT NULL REFERENCES checklist_template_versions(id),
  status               text NOT NULL CHECK (status IN ('pending','running','completed','failed')),
  started_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checklist_instances_connection_idx ON checklist_instances(connection_id);
CREATE INDEX checklist_instances_template_version_idx ON checklist_instances(template_version_id);

-- 7) Instance Results (per-check results)
CREATE TABLE checklist_instance_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  node_id         uuid NOT NULL REFERENCES checklist_nodes(id) ON DELETE CASCADE,
  status          text NOT NULL CHECK (status IN ('pass','fail','warning','skip','error')),
  issue_count     integer NOT NULL DEFAULT 0,
  pass_count      integer NOT NULL DEFAULT 0,
  output          jsonb,
  executed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, node_id)
);

CREATE INDEX checklist_instance_results_instance_idx ON checklist_instance_results(instance_id);
CREATE INDEX checklist_instance_results_status_idx ON checklist_instance_results(status);
