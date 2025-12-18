--@UP
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  title text,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  funder jsonb DEFAULT '{}',
  deadline timestamptz,
  tags text[] DEFAULT '{}',
  canonical_text text,
  criteria jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  name text,
  body text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS draft_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  opportunity_id uuid REFERENCES opportunities(id),
  template_id uuid REFERENCES templates(id),
  generated_body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  subject_id uuid,
  hash text,
  signer text,
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  variant jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  status text DEFAULT 'running',
  created_at timestamptz DEFAULT now()
);

-- optional: useful indexes
CREATE INDEX IF NOT EXISTS idx_draft_apps_project_id ON draft_apps(project_id);
CREATE INDEX IF NOT EXISTS idx_draft_apps_status ON draft_apps(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_subject_id ON ledger_entries(subject_id);

--@DOWN
DROP TABLE IF EXISTS experiments;
DROP TABLE IF EXISTS ledger_entries;
DROP TABLE IF EXISTS draft_apps;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
