-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create table if not exists public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  visual_asset_plan_item_id text,
  provider_model text,
  provider_route_json jsonb not null default '{}'::jsonb,
  prompt_plan_json jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid not null references public.generation_requests(id) on delete cascade,
  event_type text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  asset_type text,
  storage_bucket text,
  storage_path text,
  width integer,
  height integer,
  duration_seconds numeric,
  background_color text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_asset_versions (
  id uuid primary key default gen_random_uuid(),
  generated_asset_id uuid not null references public.generated_assets(id) on delete cascade,
  version integer not null,
  storage_bucket text,
  storage_path text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists public.editing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  approved_plan_snapshot_id uuid not null references public.approved_plan_snapshots(id) on delete restrict,
  job_type text,
  status text not null default 'queued',
  worker_runtime_plan_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.job_steps (
  id uuid primary key default gen_random_uuid(),
  editing_job_id uuid not null references public.editing_jobs(id) on delete cascade,
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

create table if not exists public.worker_events (
  id uuid primary key default gen_random_uuid(),
  editing_job_id uuid not null references public.editing_jobs(id) on delete cascade,
  job_step_id uuid references public.job_steps(id) on delete set null,
  event_type text,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Compatibility guard for older active baselines where generation_requests
-- already exists without an approved snapshot reference column. This adds the
-- nullable execution contract reference only; it does not backfill or invent
-- approved snapshots, generation requests, assets, jobs, worker rows, or
-- credit records.
alter table if exists public.generation_requests
  add column if not exists approved_plan_snapshot_id uuid;

comment on table public.generation_requests is 'Provider generation requests must reference approved_plan_snapshot_id before worker execution starts.';
comment on column public.generation_requests.approved_plan_snapshot_id is 'Compatibility reference to immutable approved plan snapshots. Added nullable for older local baselines before project-snapshot indexes; no backfill is invented here.';
comment on table public.editing_jobs is 'Editing jobs execute approved snapshots, not raw chat or mutable current plan state.';
comment on table public.job_steps is 'Worker-controlled job steps. Normal users must not directly insert or update job_steps in production.';
comment on table public.worker_events is 'Worker and fallback events should be audited through backend/service-role paths.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'generation_requests_approved_plan_snapshot_id_fkey') then
    alter table public.generation_requests
      add constraint generation_requests_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete restrict;
  end if;
end $$;

create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id);
create index if not exists idx_generation_requests_status on public.generation_requests(status);
create index if not exists idx_generation_events_request_created on public.generation_events(generation_request_id, created_at);
create index if not exists idx_generated_assets_project_request on public.generated_assets(project_id, generation_request_id);
create index if not exists idx_generated_asset_versions_asset_version on public.generated_asset_versions(generated_asset_id, version);
create index if not exists idx_editing_jobs_project_snapshot on public.editing_jobs(project_id, approved_plan_snapshot_id);
create index if not exists idx_editing_jobs_status on public.editing_jobs(status);
create index if not exists idx_job_steps_job_order on public.job_steps(editing_job_id, step_order);
create index if not exists idx_worker_events_job_created on public.worker_events(editing_job_id, created_at);

drop trigger if exists set_generation_requests_updated_at on public.generation_requests;
create trigger set_generation_requests_updated_at before update on public.generation_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_generated_assets_updated_at on public.generated_assets;
create trigger set_generated_assets_updated_at before update on public.generated_assets
for each row execute function public.set_updated_at();
