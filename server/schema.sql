create table if not exists projects(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists assets(
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  path text not null,
  kind text not null,
  mime text,
  meta_jsonb jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists assets_project_kind_idx on assets(project_id, kind);

create table if not exists artifacts(
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  type text not null,
  title text not null,
  asset_id uuid references assets(id),
  share_token text unique,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
