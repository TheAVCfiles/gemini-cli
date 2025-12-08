-- Schema for the decrypt_app database (Proof Layer)
-- Supports StagePort Ledger, Credential Minting, and AURA/AURE runtime state

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Minted credentials (Proof Layer)
create table if not exists stage_credentials (
    credential_id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    subject_ref_id varchar(32) not null,
    minted_at timestamptz default now(),
    credential_tier varchar(10) not null check (credential_tier in ('Gold', 'Silver')),
    core_score numeric(5,2) not null,
    kinetic_claims jsonb not null default '{}'::jsonb,
    badge_os_state varchar(50) not null,
    ledger_hash char(64) unique not null
);

create index if not exists stage_credentials_user_time_idx
    on stage_credentials(user_id, minted_at desc);

create index if not exists stage_credentials_tier_idx
    on stage_credentials(credential_tier);

-- 2) Sentient Cents ledger (economic spine)
create table if not exists sentient_cents_ledger (
    transaction_id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    minted_at timestamptz default now(),
    sc_amount integer not null check (sc_amount <> 0),
    transaction_type varchar(50) not null,
    decay_status varchar(10) not null default 'ACTIVE' check (decay_status in ('ACTIVE', 'DECAYED')),
    expires_at timestamptz
);

create index if not exists sentient_cents_user_time_idx
    on sentient_cents_ledger(user_id, minted_at desc);

create index if not exists sentient_cents_type_idx
    on sentient_cents_ledger(transaction_type);

-- 3) Physical capsule + archival linkage
create table if not exists artifact_log (
    artifact_log_id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    capsule_serial_id varchar(50) not null unique,
    mint_ticket_status boolean default false,
    onboarding_archival_path text,
    first_ticket_minted_at timestamptz
);

create index if not exists artifact_log_user_idx
    on artifact_log(user_id);

-- 4) AURA/AURE runtime state (regulation membrane)
create table if not exists aura_aure_runtime (
    user_id uuid primary key,
    last_update timestamptz default now(),
    aure_mode varchar(20) not null check (aure_mode in ('baseline', 'maintenance', 'overwhelm', 'restore')),
    load_index numeric(4,3) not null default 0.0,
    stability_gauge numeric(4,3) not null default 1.0,
    drift_index numeric(4,3) not null default 0.0
);

-- Note: attach foreign keys to your canonical users table once available.
