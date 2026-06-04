-- Phase 51B activation milestone registry.
-- Safe apply scope: staging/local only after explicit confirmation.
-- This migration is idempotent and creates service-role-only activation ledger tables.
-- It does not drop tables, reset data, create public policies, expose service-role
-- access to frontend roles, or change production/beta gates.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.activation_runs (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  phase_name text not null,
  run_id text not null,
  status text not null
    check (status in ('planned', 'completed', 'partial', 'blocked')),
  track text not null,
  subsystem text not null,
  branch text,
  pr_number integer,
  pr_url text,
  base_branch text,
  commit_sha text,
  qa_status text not null
    check (qa_status in ('passed', 'blocked', 'warning')),
  readiness_status text not null,
  completed_at timestamptz,
  summary text not null,
  summary_json jsonb not null default '{}'::jsonb,
  blockers_json jsonb not null default '[]'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, run_id)
);

comment on table public.activation_runs is
'Service-role-only ReeditPro activation/readiness run ledger. Stores sanitized phase metadata and private artifact pointers only.';
comment on column public.activation_runs.summary_json is
'Sanitized JSON summary. Must not contain secrets, signed URLs, raw provider responses, raw prompts for execution, row payload dumps, or public artifact URLs as source of truth.';

create table if not exists public.activation_artifacts (
  id uuid primary key default gen_random_uuid(),
  activation_run_id uuid not null references public.activation_runs(id) on delete cascade,
  artifact_id text not null,
  artifact_type text not null,
  gcs_path text not null,
  source_of_truth boolean not null default true,
  signed_url_source_of_truth boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activation_run_id, artifact_type, gcs_path),
  check (gcs_path like 'gs://%'),
  check (signed_url_source_of_truth = false)
);

comment on table public.activation_artifacts is
'Private GCS artifact references for activation evidence. Stores gs:// paths and sanitized metadata only, never blobs or signed URLs.';

create table if not exists public.activation_qa_gates (
  id uuid primary key default gen_random_uuid(),
  activation_run_id uuid not null references public.activation_runs(id) on delete cascade,
  gate_id text not null,
  gate_status text not null
    check (gate_status in ('passed', 'blocked', 'warning')),
  mandatory boolean not null default true,
  summary text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activation_run_id, gate_id)
);

comment on table public.activation_qa_gates is
'Mandatory and advisory QA gate outcomes for activation runs, service-role only.';

create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  subsystem text not null,
  readiness_key text not null,
  readiness_status text not null,
  scope text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  last_activation_run_id uuid references public.activation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subsystem, readiness_key)
);

comment on table public.readiness_snapshots is
'Current activation readiness facts by subsystem. Service-role only; not a frontend feature flag store.';

create table if not exists public.tool_capabilities (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  display_name text not null,
  track text not null,
  subsystem text not null,
  readiness_state text not null,
  runtime_allowed boolean not null default false,
  production_allowed boolean not null default false,
  external_beta_allowed boolean not null default false,
  broad_media_allowed boolean not null default false,
  evidence_json jsonb not null default '{}'::jsonb,
  last_activation_run_id uuid references public.activation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track, tool_id),
  check (production_allowed = false),
  check (external_beta_allowed = false),
  check (broad_media_allowed = false)
);

comment on table public.tool_capabilities is
'Tool readiness and runtime capability ledger. Phase 51B keeps production/external beta/broad media flags false.';

create table if not exists public.feature_gates (
  id uuid primary key default gen_random_uuid(),
  gate_key text not null unique,
  gate_name text not null,
  gate_status text not null
    check (gate_status in ('disabled', 'blocked', 'readiness_only')),
  enabled boolean not null default false,
  production_allowed boolean not null default false,
  external_beta_allowed boolean not null default false,
  paid_production_allowed boolean not null default false,
  broad_media_allowed boolean not null default false,
  evidence_json jsonb not null default '{}'::jsonb,
  last_activation_run_id uuid references public.activation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (enabled = false),
  check (production_allowed = false),
  check (external_beta_allowed = false),
  check (paid_production_allowed = false),
  check (broad_media_allowed = false)
);

comment on table public.feature_gates is
'Fail-closed activation feature gate ledger. Production, external beta, paid production, broad media, public artifacts, and raw prompt execution stay disabled in Phase 51B.';

create index if not exists idx_activation_runs_phase_run on public.activation_runs(phase_id, run_id);
create index if not exists idx_activation_runs_status on public.activation_runs(status);
create index if not exists idx_activation_artifacts_run on public.activation_artifacts(activation_run_id);
create index if not exists idx_activation_artifacts_type on public.activation_artifacts(artifact_type);
create index if not exists idx_activation_qa_gates_run on public.activation_qa_gates(activation_run_id);
create index if not exists idx_readiness_snapshots_key on public.readiness_snapshots(subsystem, readiness_key);
create index if not exists idx_tool_capabilities_track_tool on public.tool_capabilities(track, tool_id);
create index if not exists idx_feature_gates_status on public.feature_gates(gate_status);

drop trigger if exists activation_runs_set_updated_at on public.activation_runs;
create trigger activation_runs_set_updated_at before update on public.activation_runs
for each row execute function public.set_updated_at();

drop trigger if exists activation_artifacts_set_updated_at on public.activation_artifacts;
create trigger activation_artifacts_set_updated_at before update on public.activation_artifacts
for each row execute function public.set_updated_at();

drop trigger if exists activation_qa_gates_set_updated_at on public.activation_qa_gates;
create trigger activation_qa_gates_set_updated_at before update on public.activation_qa_gates
for each row execute function public.set_updated_at();

drop trigger if exists readiness_snapshots_set_updated_at on public.readiness_snapshots;
create trigger readiness_snapshots_set_updated_at before update on public.readiness_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists tool_capabilities_set_updated_at on public.tool_capabilities;
create trigger tool_capabilities_set_updated_at before update on public.tool_capabilities
for each row execute function public.set_updated_at();

drop trigger if exists feature_gates_set_updated_at on public.feature_gates;
create trigger feature_gates_set_updated_at before update on public.feature_gates
for each row execute function public.set_updated_at();

alter table public.activation_runs enable row level security;
alter table public.activation_artifacts enable row level security;
alter table public.activation_qa_gates enable row level security;
alter table public.readiness_snapshots enable row level security;
alter table public.tool_capabilities enable row level security;
alter table public.feature_gates enable row level security;

revoke all on table public.activation_runs from public, anon, authenticated;
revoke all on table public.activation_artifacts from public, anon, authenticated;
revoke all on table public.activation_qa_gates from public, anon, authenticated;
revoke all on table public.readiness_snapshots from public, anon, authenticated;
revoke all on table public.tool_capabilities from public, anon, authenticated;
revoke all on table public.feature_gates from public, anon, authenticated;

grant select, insert, update, delete on table public.activation_runs to service_role;
grant select, insert, update, delete on table public.activation_artifacts to service_role;
grant select, insert, update, delete on table public.activation_qa_gates to service_role;
grant select, insert, update, delete on table public.readiness_snapshots to service_role;
grant select, insert, update, delete on table public.tool_capabilities to service_role;
grant select, insert, update, delete on table public.feature_gates to service_role;
