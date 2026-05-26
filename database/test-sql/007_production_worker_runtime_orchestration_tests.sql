-- ReeditPro manual SQL smoke tests.
-- Do not run in production.
-- Use only in local/staging Supabase testing after reviewing and applying:
-- database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql

-- Production worker runtime table existence.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'production_worker_jobs',
    'production_worker_leases',
    'production_worker_events',
    'production_worker_attempts',
    'production_worker_idempotency_keys'
  )
order by table_name;

-- approved_snapshot_id is required for production worker jobs.
select
  column_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'production_worker_jobs'
  and column_name = 'approved_snapshot_id';

-- idempotency_key is required for production worker jobs.
select
  column_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'production_worker_jobs'
  and column_name = 'idempotency_key';

-- worker_type is present and required.
select
  column_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'production_worker_jobs'
  and column_name = 'worker_type';

-- Event table supports sanitized summaries.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'production_worker_events'
  and column_name in ('payload_summary_json', 'message', 'progress_percent');

-- Idempotency key uniqueness pattern exists.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'production_worker_idempotency_keys'
  and c.contype = 'u'
  and pg_get_constraintdef(c.oid) ilike '%workspace_id%'
  and pg_get_constraintdef(c.oid) ilike '%idempotency_key%';

-- No persistent signed_url column exists in worker runtime tables.
select
  count(*) = 0 as worker_runtime_has_no_signed_url_columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'production_worker_jobs',
    'production_worker_leases',
    'production_worker_events',
    'production_worker_attempts',
    'production_worker_idempotency_keys'
  )
  and column_name ilike '%signed%url%';

-- No raw_prompt column exists in worker runtime tables.
select
  count(*) = 0 as worker_runtime_has_no_raw_prompt_columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'production_worker_jobs',
    'production_worker_leases',
    'production_worker_events',
    'production_worker_attempts',
    'production_worker_idempotency_keys'
  )
  and column_name ilike '%raw%prompt%';

-- No secret_value column exists in worker runtime tables.
select
  count(*) = 0 as worker_runtime_has_no_secret_value_columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'production_worker_jobs',
    'production_worker_leases',
    'production_worker_events',
    'production_worker_attempts',
    'production_worker_idempotency_keys'
  )
  and column_name ilike '%secret%value%';

-- Payload constraints should mention forbidden raw prompt / signed URL / secret fields.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('production_worker_jobs', 'production_worker_events')
  and c.contype = 'c'
  and (
    pg_get_constraintdef(c.oid) ilike '%rawPrompt%'
    or pg_get_constraintdef(c.oid) ilike '%signedUrl%'
    or pg_get_constraintdef(c.oid) ilike '%secretValue%'
  )
order by t.relname, conname;
