-- migrations/CREATE_KOI_ATTEMPTS.sql
-- Creates koi_attempts table + indexes for KOI resilience node.

BEGIN;

CREATE TABLE IF NOT EXISTS public.koi_attempts (
  id BIGSERIAL PRIMARY KEY,
  task_key TEXT NOT NULL,           -- idempotency key
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,             -- pending/succeeded/failed/dead
  attempt INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 9,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_error TEXT,
  payload_ref TEXT,                 -- MinIO object key or external ref
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_koi_next_run ON public.koi_attempts(next_run_at);
CREATE INDEX IF NOT EXISTS idx_koi_task_key ON public.koi_attempts(task_key);

COMMIT;
