-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: future provider generation requests, generated assets, editing jobs, job steps, and worker events.
-- Hardening note: generation and job execution must start from approved_plan_snapshot_id and service-role worker boundaries.

create table if not exists generation_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete restrict,
  approved_plan_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  visual_asset_plan_item_id text,
  provider_model text,
  provider_route_json jsonb not null default '{}'::jsonb,
  prompt_plan_json jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  credit_reservation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table generation_requests is 'Draft provider request table. Approved execution starts from approved_plan_snapshot_id, not raw chat.';
comment on column generation_requests.credit_reservation_id is 'Draft future credit reservation link. Credit ledger/reservation tables are not finalized in RP-DATA-02.';
comment on column generation_requests.approved_plan_snapshot_id is 'Required approved snapshot link before any future worker/provider execution starts.';

create table if not exists generation_events (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid not null references generation_requests(id) on delete cascade,
  event_type text,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table generation_events is 'Draft generation event log for future provider lifecycle and audit metadata.';
comment on column generation_events.event_json is 'Fallback, retry, provider route, and worker event details should be audited here by backend/service role.';

create table if not exists generated_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  generation_request_id uuid references generation_requests(id) on delete set null,
  asset_type text,
  storage_bucket text,
  storage_path text,
  width integer,
  height integer,
  duration_seconds numeric,
  background_color text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

comment on table generated_assets is 'Draft generated asset table. Provider models create assets/clips only; Remotion owns final composition.';

create table if not exists generated_asset_versions (
  id uuid primary key default gen_random_uuid(),
  generated_asset_id uuid not null references generated_assets(id) on delete cascade,
  version integer not null,
  storage_bucket text,
  storage_path text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

comment on table generated_asset_versions is 'Draft generated asset version table for future revisions and fallback outputs.';

create table if not exists editing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete restrict,
  approved_plan_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  job_type text,
  status text not null default 'queued',
  worker_runtime_plan_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

comment on table editing_jobs is 'Draft editing job table. Jobs must reference approved_plan_snapshot_id before any future worker execution.';
comment on column editing_jobs.approved_plan_snapshot_id is 'Required worker execution contract. Jobs execute approved snapshots, not raw chat.';

create table if not exists job_steps (
  id uuid primary key default gen_random_uuid(),
  editing_job_id uuid not null references editing_jobs(id) on delete cascade,
  step_order integer not null,
  step_type text,
  worker_group text,
  status text not null default 'planned',
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error_json jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz
);

comment on table job_steps is 'Draft worker step table. Worker inputs and outputs should stay tied to the approved snapshot job context.';
comment on column job_steps.input_json is 'Worker-controlled input envelope; normal users should not directly insert or update job_steps in production.';
comment on column job_steps.output_json is 'Worker-controlled output envelope that should be audited through job/worker events.';

create table if not exists worker_events (
  id uuid primary key default gen_random_uuid(),
  editing_job_id uuid not null references editing_jobs(id) on delete cascade,
  job_step_id uuid references job_steps(id) on delete set null,
  event_type text,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table worker_events is 'Draft worker event log. Future service-role writes should record job lifecycle and system events.';
comment on column worker_events.event_json is 'Worker fallback, retry, and failure events should be captured for audit without exposing secrets.';

create index if not exists idx_generation_requests_project_snapshot on generation_requests(project_id, approved_plan_snapshot_id);
create index if not exists idx_generation_events_request_created_at on generation_events(generation_request_id, created_at);
create index if not exists idx_generated_assets_project_request on generated_assets(project_id, generation_request_id);
create index if not exists idx_generated_asset_versions_asset on generated_asset_versions(generated_asset_id, version);
create index if not exists idx_editing_jobs_project_snapshot on editing_jobs(project_id, approved_plan_snapshot_id);
create index if not exists idx_job_steps_job_order on job_steps(editing_job_id, step_order);
create index if not exists idx_worker_events_job_created_at on worker_events(editing_job_id, created_at);
