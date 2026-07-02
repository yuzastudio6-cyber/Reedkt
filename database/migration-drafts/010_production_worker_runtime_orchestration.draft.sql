-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- Generated for RP-PROD-RUNTIME-04.

-- Purpose: draft production worker runtime orchestration tables for approved
-- snapshot worker jobs, mock-safe lease shape, sanitized event summaries,
-- attempt records, and stable idempotency keys.
-- Core rule: workers execute approved snapshots only, never raw chat.

create table if not exists production_worker_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid references media_assets(id) on delete set null,
  approved_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  tool_execution_plan_id uuid not null references tool_execution_plans(id) on delete cascade,
  worker_type text not null,
  execution_mode text not null,
  status text not null default 'queued',
  idempotency_key text not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 1,
  payload_json jsonb not null default '{}'::jsonb,
  gate_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_worker_jobs_worker_type_check check (
    worker_type in ('cpu_analysis_worker', 'gpu_ai_worker', 'render_worker', 'qa_worker', 'tool_readiness_worker')
  ),
  constraint production_worker_jobs_execution_mode_check check (
    execution_mode in ('dry_run', 'mock_safe', 'production_ready', 'production_blocked')
  ),
  constraint production_worker_jobs_status_check check (
    status in ('queued', 'gated', 'ready', 'claimed', 'running', 'heartbeat_stale', 'retry_wait', 'completed', 'failed', 'blocked', 'cancelled')
  ),
  constraint production_worker_jobs_payload_no_forbidden_fields_check check (
    payload_json::text not ilike '%rawPrompt%'
    and payload_json::text not ilike '%raw_prompt%'
    and payload_json::text not ilike '%rawUserChat%'
    and payload_json::text not ilike '%raw_user_chat%'
    and payload_json::text not ilike '%signedUrl%'
    and payload_json::text not ilike '%signed_url%'
    and payload_json::text not ilike '%serviceRoleKey%'
    and payload_json::text not ilike '%service_role_key%'
    and payload_json::text not ilike '%providerApiKey%'
    and payload_json::text not ilike '%provider_api_key%'
    and payload_json::text not ilike '%secretValue%'
    and payload_json::text not ilike '%secret_value%'
  )
);

comment on table production_worker_jobs is 'Draft production worker jobs. Workers execute approved_snapshot_id and tool_execution_plan_id only.';
comment on column production_worker_jobs.payload_json is 'Payload summary must not contain raw prompts, signed URLs, secrets, provider keys, or service role keys.';
comment on column production_worker_jobs.approved_snapshot_id is 'Required immutable approved snapshot reference before any production worker execution.';

create table if not exists production_worker_leases (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references production_worker_jobs(id) on delete cascade,
  worker_type text not null,
  worker_instance_id text not null,
  lease_status text not null default 'claimed',
  claimed_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz,
  constraint production_worker_leases_status_check check (
    lease_status in ('claimed', 'active', 'released', 'stale', 'failed')
  )
);

comment on table production_worker_leases is 'Draft worker lease records for transactional future claim/heartbeat/release behavior.';

create table if not exists production_worker_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references production_worker_jobs(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  worker_type text not null,
  event_name text not null,
  message text not null,
  progress_percent integer,
  payload_summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint production_worker_events_progress_check check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  ),
  constraint production_worker_events_payload_no_forbidden_fields_check check (
    payload_summary_json::text not ilike '%rawPrompt%'
    and payload_summary_json::text not ilike '%raw_prompt%'
    and payload_summary_json::text not ilike '%signedUrl%'
    and payload_summary_json::text not ilike '%signed_url%'
    and payload_summary_json::text not ilike '%serviceRoleKey%'
    and payload_summary_json::text not ilike '%providerApiKey%'
    and payload_summary_json::text not ilike '%secretValue%'
  )
);

comment on table production_worker_events is 'Draft sanitized worker event log. Payload summaries must not contain raw prompts, signed URLs, secrets, provider keys, or service role keys.';

create table if not exists production_worker_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references production_worker_jobs(id) on delete cascade,
  attempt_number integer not null,
  status text not null,
  failure_category text,
  started_at timestamptz,
  completed_at timestamptz,
  result_summary_json jsonb not null default '{}'::jsonb,
  constraint production_worker_attempts_status_check check (
    status in ('queued', 'running', 'completed', 'failed', 'blocked', 'cancelled')
  ),
  constraint production_worker_attempts_failure_category_check check (
    failure_category is null or failure_category in (
      'transient_runtime',
      'tool_unavailable',
      'missing_artifact',
      'qa_failed',
      'policy_blocked',
      'license_blocked',
      'model_weight_blocked',
      'credit_blocked',
      'invalid_payload',
      'unknown'
    )
  )
);

comment on table production_worker_attempts is 'Draft worker attempt summaries. Policy/secret/raw-prompt blocks are not retryable.';

create table if not exists production_worker_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  job_id uuid not null references production_worker_jobs(id) on delete cascade,
  payload_hash text not null,
  status text not null default 'recorded',
  created_at timestamptz not null default now(),
  constraint production_worker_idempotency_keys_status_check check (
    status in ('recorded', 'running', 'completed', 'conflict', 'blocked')
  ),
  constraint production_worker_idempotency_keys_unique unique (workspace_id, idempotency_key)
);

comment on table production_worker_idempotency_keys is 'Draft stable ID-based idempotency keys. Keys are derived from approved snapshot/tool plan IDs, never raw chat.';

create index if not exists production_worker_jobs_workspace_idx on production_worker_jobs(workspace_id);
create index if not exists production_worker_jobs_project_idx on production_worker_jobs(project_id);
create index if not exists production_worker_jobs_media_asset_idx on production_worker_jobs(media_asset_id);
create index if not exists production_worker_jobs_approved_snapshot_idx on production_worker_jobs(approved_snapshot_id);
create index if not exists production_worker_jobs_tool_execution_plan_idx on production_worker_jobs(tool_execution_plan_id);
create index if not exists production_worker_jobs_worker_type_idx on production_worker_jobs(worker_type);
create index if not exists production_worker_jobs_status_idx on production_worker_jobs(status);
create index if not exists production_worker_jobs_idempotency_key_idx on production_worker_jobs(idempotency_key);

create index if not exists production_worker_leases_job_idx on production_worker_leases(job_id);
create index if not exists production_worker_leases_worker_type_idx on production_worker_leases(worker_type);
create index if not exists production_worker_leases_status_idx on production_worker_leases(lease_status);

create index if not exists production_worker_events_job_idx on production_worker_events(job_id);
create index if not exists production_worker_events_workspace_idx on production_worker_events(workspace_id);
create index if not exists production_worker_events_project_idx on production_worker_events(project_id);
create index if not exists production_worker_events_worker_type_idx on production_worker_events(worker_type);

create index if not exists production_worker_attempts_job_idx on production_worker_attempts(job_id);
create index if not exists production_worker_attempts_status_idx on production_worker_attempts(status);

create index if not exists production_worker_idempotency_keys_workspace_idx on production_worker_idempotency_keys(workspace_id);
create index if not exists production_worker_idempotency_keys_job_idx on production_worker_idempotency_keys(job_id);
create index if not exists production_worker_idempotency_keys_status_idx on production_worker_idempotency_keys(status);
