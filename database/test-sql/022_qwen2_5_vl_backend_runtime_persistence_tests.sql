-- ReeditPro manual SQL smoke tests.
-- Do not run in production.
-- Use only in approved local/staging Supabase testing after reviewing and applying:
-- database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql

-- Required runtime baseline tables for Qwen persistence.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'approved_plan_snapshots',
    'credit_reservations',
    'jobs',
    'job_events',
    'worker_runtime_configs',
    'worker_leases',
    'backend_runtime_messages',
    'job_claim_attempts',
    'api_idempotency_keys',
    'worker_job_claims',
    'storage_object_records',
    'signed_url_events',
    'tool_runtime_checks'
  )
order by table_name;

-- Qwen jobs must use the existing media_analysis job type.
select
  enumlabel
from pg_enum
where enumtypid = 'public.job_type'::regtype
  and enumlabel = 'media_analysis';

-- Qwen job payload guard exists.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'jobs'
  and c.conname = 'qwen25_vl_jobs_payload_refs_check';

-- Qwen job event payload guard exists.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'job_events'
  and c.conname = 'qwen25_vl_job_events_sanitized_payload_check';

-- Qwen runtime config guard exists and requires non-secret L4 metadata.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'worker_runtime_configs'
  and c.conname = 'qwen25_vl_worker_runtime_config_check';

-- Qwen worker lease and transport guards exist.
select
  t.relname,
  c.conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('worker_leases', 'backend_runtime_messages', 'job_claim_attempts')
  and c.conname in (
    'qwen25_vl_worker_leases_refs_check',
    'qwen25_vl_backend_runtime_messages_sanitized_check',
    'qwen25_vl_job_claim_attempts_sanitized_check'
  )
order by t.relname, c.conname;

-- tool_runtime_checks now allows qwen_vl readiness evidence without creating a parallel table.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'tool_runtime_checks'
  and c.conname = 'tool_runtime_checks_tool_name_check'
  and pg_get_constraintdef(c.oid) ilike '%qwen_vl%';

-- Qwen-specific indexes exist.
select
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'jobs_qwen_worker_type_idx',
    'jobs_qwen_approved_snapshot_ref_idx',
    'backend_runtime_messages_qwen_target_idx',
    'worker_leases_qwen_active_idx',
    'api_idempotency_keys_qwen_request_path_idx'
  )
order by indexname;

-- Existing one-active claim and lease indexes remain present.
select
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'worker_job_claims_active_job_uidx',
    'worker_leases_active_job_uidx'
  )
order by indexname;

-- Canonical storage records must not store signed URL fields.
select
  count(*) = 0 as qwen_storage_records_have_no_signed_url_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'storage_object_records'
  and column_name ilike '%signed%url%';

-- Signed URL audits must not store URL values.
select
  count(*) = 0 as qwen_signed_url_events_have_no_url_value_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'signed_url_events'
  and column_name in ('url', 'signed_url', 'public_url');

-- Runtime payload surfaces must not have raw prompt columns.
select
  count(*) = 0 as qwen_runtime_surfaces_have_no_raw_prompt_columns
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'jobs',
    'job_events',
    'worker_runtime_configs',
    'worker_leases',
    'backend_runtime_messages',
    'job_claim_attempts'
  )
  and column_name ilike '%raw%prompt%';

-- Example negative checks for future local/staging validation only.
-- These are intentionally commented. They should fail if enabled because Qwen
-- job payloads require approved snapshot refs, credit reservations, private
-- source refs, checksums, structured finding/edit intent refs, and sanitized
-- payloads.
-- insert into public.jobs (workspace_id, project_id, job_type, input_payload)
-- values (
--   gen_random_uuid(),
--   gen_random_uuid(),
--   'media_analysis',
--   '{"worker_type":"qwen2_5_vl_cloud_run_gpu_worker"}'::jsonb
-- );

-- insert into public.backend_runtime_messages (request_id, target, transport_mode, safety_level, payload)
-- values (
--   'qwen-negative-runtime-message',
--   'qwen2_5_vl_private_invoke',
--   'private',
--   'metadata_only',
--   '{"raw_prompt":"blocked"}'::jsonb
-- );
