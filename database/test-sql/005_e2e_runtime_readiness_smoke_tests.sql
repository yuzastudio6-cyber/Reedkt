-- ReeditPro manual SQL smoke tests.
-- Do not run in production.
-- Use only in local/staging Supabase testing after applying:
-- supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql

-- RP-E2E-READY-01 runtime table existence.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'approved_plan_snapshots',
    'api_idempotency_keys',
    'upload_intents',
    'storage_object_records',
    'signed_url_events',
    'worker_job_claims',
    'tool_runtime_checks',
    'provider_request_attempts',
    'provider_webhook_events'
  )
order by table_name;

-- Approved snapshots: required RP-E2E columns exist.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'approved_plan_snapshots'
  and column_name in (
    'workspace_id',
    'project_id',
    'chat_session_id',
    'edit_plan_id',
    'credit_estimate_id',
    'credit_approval_id',
    'credit_reservation_id',
    'approved_by_user_id',
    'snapshot_version',
    'snapshot_status',
    'snapshot_json',
    'plan_hash',
    'credit_hash',
    'source_sequence_hash',
    'timing_hash',
    'created_at',
    'updated_at'
  )
order by column_name;

-- Approved snapshot negative checklist.
-- This should fail in local/staging because existing approved_plan_snapshots
-- requires core IDs and snapshot_json. Future backend code must also provide
-- the RP-E2E fields before workers execute the snapshot.
-- insert into public.approved_plan_snapshots (snapshot_json) values ('{}'::jsonb);

-- Idempotency uniqueness: exactly one unique key should protect workspace/user/key.
select
  constraint_name,
  constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'api_idempotency_keys'
  and constraint_type = 'UNIQUE';

-- Upload intent status flow shape: status constraint exists and includes the
-- planned -> signed/uploading -> finalized/expired/cancelled/failed lifecycle.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'upload_intents'
  and c.contype = 'c'
  and pg_get_constraintdef(c.oid) ilike '%status%';

-- Active worker claim uniqueness: only one active worker can claim a job.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'worker_job_claims'
  and indexname = 'worker_job_claims_active_job_uidx';

-- Provider webhook uniqueness: duplicate provider event IDs should be blocked.
select
  constraint_name,
  constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'provider_webhook_events'
  and constraint_type = 'UNIQUE';

-- Canonical storage records must not store signed URLs.
select
  count(*) = 0 as storage_object_records_have_no_signed_url_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'storage_object_records'
  and column_name ilike '%signed%url%';

-- Signed URL audits store metadata only, not URL values.
select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'signed_url_events'
order by ordinal_position;

-- Helper functions exist for future backend/service-role paths.
select
  proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'can_create_approved_plan_snapshot',
    'active_worker_claim_exists',
    'can_claim_worker_job'
  )
order by proname;
