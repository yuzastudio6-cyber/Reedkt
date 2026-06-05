-- Supabase activation milestone registry schema/RLS.
-- Local/staging migration candidate only. Do not run against production until
-- Foundation/Supabase review, local validation, staging validation, backups,
-- rollback acceptance, and explicit production approval are complete.
--
-- This migration creates schema only. It does not backfill Track B rows, write
-- milestone data, deploy providers, run workers, process media, or unlock beta
-- or production.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.activation_milestones (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  track text not null,
  family text not null,
  milestone_name text not null,
  milestone_status text not null default 'planned'
    check (milestone_status in ('planned', 'passed', 'blocked', 'warning', 'skipped', 'approved')),
  readiness_status text not null default 'blocked',
  beta_status text not null default 'blocked',
  branch text,
  pr_number integer check (pr_number is null or pr_number > 0),
  pr_url text check (pr_url is null or pr_url ~ '^https://github\.com/yuzastudio6-cyber/Reedkt/pull/[0-9]+$'),
  commit_sha text,
  source_report_path text not null check (source_report_path like 'docs/%'),
  export_version text,
  production_allowed boolean not null default false check (production_allowed = false),
  external_beta_allowed boolean not null default false check (external_beta_allowed = false),
  paid_production_allowed boolean not null default false check (paid_production_allowed = false),
  broad_media_allowed boolean not null default false check (broad_media_allowed = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  provider_calls_allowed boolean not null default false check (provider_calls_allowed = false),
  summary_json jsonb not null default '{}'::jsonb,
  evidence_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, track, family, milestone_name)
);

comment on table public.activation_milestones is
'Sanitized activation milestone summary rows for staging/Foundation reporting. Store safe metadata only; no secrets, signed URLs, raw prompts, private payload contents, media/audio/model payloads, or user PII.';
comment on column public.activation_milestones.source_report_path is
'Committed safe source report path under docs/. Do not store signed URLs or private artifact contents.';
comment on column public.activation_milestones.summary_json is
'Sanitized summary metadata only. Must not include credentials, raw prompts, media payloads, private artifact contents, or user PII.';

create table if not exists public.activation_phase_runs (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  run_id text not null,
  run_status text not null default 'planned'
    check (run_status in ('planned', 'passed', 'blocked', 'warning', 'skipped', 'approved')),
  track text not null,
  family text not null,
  branch text,
  pr_number integer check (pr_number is null or pr_number > 0),
  pr_url text check (pr_url is null or pr_url ~ '^https://github\.com/yuzastudio6-cyber/Reedkt/pull/[0-9]+$'),
  commit_sha text,
  source_report_path text not null check (source_report_path like 'docs/%'),
  started_at timestamptz,
  completed_at timestamptz,
  production_allowed boolean not null default false check (production_allowed = false),
  external_beta_allowed boolean not null default false check (external_beta_allowed = false),
  paid_production_allowed boolean not null default false check (paid_production_allowed = false),
  broad_media_allowed boolean not null default false check (broad_media_allowed = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  provider_calls_allowed boolean not null default false check (provider_calls_allowed = false),
  result_json jsonb not null default '{}'::jsonb,
  blocker_codes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, run_id)
);

comment on table public.activation_phase_runs is
'Sanitized activation run evidence. Rows are service-role-only and carry safe metadata/hashes/counts only.';

create table if not exists public.activation_tool_readiness (
  id uuid primary key default gen_random_uuid(),
  track text not null,
  family text not null,
  tool_id text not null,
  phase_id text not null,
  readiness_status text not null,
  internal_ready boolean not null default false,
  initial_internal_testing_included boolean not null default false,
  allowed_scope jsonb not null default '[]'::jsonb,
  blocked_scope jsonb not null default '[]'::jsonb,
  next_required_phase text,
  source_report_path text not null check (source_report_path like 'docs/%'),
  production_allowed boolean not null default false check (production_allowed = false),
  external_beta_allowed boolean not null default false check (external_beta_allowed = false),
  paid_production_allowed boolean not null default false check (paid_production_allowed = false),
  broad_media_allowed boolean not null default false check (broad_media_allowed = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  provider_calls_allowed boolean not null default false check (provider_calls_allowed = false),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track, tool_id, phase_id)
);

comment on table public.activation_tool_readiness is
'Sanitized Track B tool readiness metadata. This table is not a production router and does not permit tool execution.';

create table if not exists public.activation_pr_evidence (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  pr_number integer not null check (pr_number > 0),
  pr_url text not null check (pr_url ~ '^https://github\.com/yuzastudio6-cyber/Reedkt/pull/[0-9]+$'),
  branch text,
  commit_sha text,
  evidence_status text not null default 'recorded'
    check (evidence_status in ('recorded', 'passed', 'blocked', 'warning', 'skipped')),
  source_report_path text not null check (source_report_path like 'docs/%'),
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, pr_number, source_report_path)
);

comment on table public.activation_pr_evidence is
'PR evidence references for activation milestones. Store PR metadata and committed report references only.';

create table if not exists public.activation_artifact_manifests (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  artifact_prefix text not null,
  artifact_storage_class text not null default 'committed_safe_metadata'
    check (artifact_storage_class in ('committed_safe_metadata', 'private_gcs_metadata', 'private_gcs_artifact_manifest', 'local_fixture_metadata')),
  artifact_object_count integer not null default 0 check (artifact_object_count >= 0),
  artifact_total_bytes bigint not null default 0 check (artifact_total_bytes >= 0),
  artifact_manifest_hash text,
  source_report_path text not null check (source_report_path like 'docs/%'),
  private_payload_contents_stored boolean not null default false check (private_payload_contents_stored = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  temporary_url_source_of_truth boolean not null default false check (temporary_url_source_of_truth = false),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, artifact_prefix, source_report_path)
);

comment on table public.activation_artifact_manifests is
'Safe artifact manifest metadata only. Never store raw private artifact contents, signed URLs, media/audio/model payloads, transcripts, or secrets.';

create table if not exists public.activation_blockers (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  blocker_code text not null,
  blocked_scope text not null,
  blocker_status text not null default 'active'
    check (blocker_status in ('active', 'resolved', 'deferred', 'accepted_for_scope')),
  severity text not null default 'blocking'
    check (severity in ('blocking', 'warning', 'info')),
  source_report_path text not null check (source_report_path like 'docs/%'),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, blocker_code, blocked_scope)
);

comment on table public.activation_blockers is
'Activation blocker registry. This stores blocker codes and scopes only, not sensitive payloads.';

create table if not exists public.activation_allowed_scopes (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  allowed_scope text not null,
  scope_status text not null default 'restricted_internal'
    check (scope_status in ('restricted_internal', 'metadata_only', 'planning_only', 'staging_only')),
  source_report_path text not null check (source_report_path like 'docs/%'),
  production_allowed boolean not null default false check (production_allowed = false),
  external_beta_allowed boolean not null default false check (external_beta_allowed = false),
  paid_production_allowed boolean not null default false check (paid_production_allowed = false),
  broad_media_allowed boolean not null default false check (broad_media_allowed = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  provider_calls_allowed boolean not null default false check (provider_calls_allowed = false),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, allowed_scope)
);

comment on table public.activation_allowed_scopes is
'Restricted internal allowed-scope metadata. This table does not unlock production, public output, providers, broad media, or external beta.';

create table if not exists public.activation_blocked_scopes (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  blocked_scope text not null,
  blocker_code text not null,
  source_report_path text not null check (source_report_path like 'docs/%'),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, blocked_scope)
);

comment on table public.activation_blocked_scopes is
'Blocked activation scopes, including production, external beta, providers, broad media, public output, VLM/Demucs blocks, and Track A boundaries.';

create table if not exists public.activation_next_phases (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  next_phase text not null,
  next_phase_status text not null default 'recommended'
    check (next_phase_status in ('recommended', 'required', 'blocked_until_approved', 'deferred')),
  handoff_prompt_path text check (handoff_prompt_path is null or handoff_prompt_path like 'docs/%'),
  source_report_path text not null check (source_report_path like 'docs/%'),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, next_phase)
);

comment on table public.activation_next_phases is
'Next-phase recommendations and approval handoffs. Future execution still requires explicit phase approvals and confirmations.';

create table if not exists public.activation_human_approvals (
  id uuid primary key default gen_random_uuid(),
  approval_key text not null unique,
  phase_id text not null,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected', 'blocked', 'expired')),
  approval_scope text not null,
  reviewer_reference text not null default 'redacted_required_at_execution_time',
  decision_date date,
  source_report_path text not null check (source_report_path like 'docs/%'),
  production_allowed boolean not null default false check (production_allowed = false),
  external_beta_allowed boolean not null default false check (external_beta_allowed = false),
  paid_production_allowed boolean not null default false check (paid_production_allowed = false),
  broad_media_allowed boolean not null default false check (broad_media_allowed = false),
  public_output_allowed boolean not null default false check (public_output_allowed = false),
  provider_calls_allowed boolean not null default false check (provider_calls_allowed = false),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.activation_human_approvals is
'Human approval decision metadata with reviewer details redacted. Does not contain credentials, private payloads, or PII.';

create table if not exists public.activation_sync_audit_log (
  id uuid primary key default gen_random_uuid(),
  sync_key text not null unique,
  phase_id text not null,
  sync_status text not null default 'planned'
    check (sync_status in ('planned', 'passed', 'blocked', 'warning', 'skipped')),
  sync_direction text not null default 'docs_to_staging'
    check (sync_direction in ('docs_to_staging', 'staging_verify', 'rollback_cleanup', 'report_only')),
  source_report_path text not null check (source_report_path like 'docs/%'),
  rows_attempted integer not null default 0 check (rows_attempted >= 0),
  rows_written integer not null default 0 check (rows_written >= 0),
  rows_verified integer not null default 0 check (rows_verified >= 0),
  production_affected boolean not null default false check (production_affected = false),
  remote_sql_run boolean not null default false check (remote_sql_run = false),
  migration_deployment boolean not null default false check (migration_deployment = false),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.activation_sync_audit_log is
'Sanitized audit log for future staging metadata sync. Do not store credentials, raw SQL payloads, private artifact contents, provider payloads, or user PII.';

create index if not exists activation_milestones_phase_idx on public.activation_milestones (phase_id);
create index if not exists activation_milestones_track_family_idx on public.activation_milestones (track, family);
create index if not exists activation_phase_runs_phase_idx on public.activation_phase_runs (phase_id);
create index if not exists activation_tool_readiness_tool_idx on public.activation_tool_readiness (tool_id);
create index if not exists activation_pr_evidence_phase_idx on public.activation_pr_evidence (phase_id);
create index if not exists activation_artifact_manifests_phase_idx on public.activation_artifact_manifests (phase_id);
create index if not exists activation_blockers_phase_idx on public.activation_blockers (phase_id);
create index if not exists activation_allowed_scopes_phase_idx on public.activation_allowed_scopes (phase_id);
create index if not exists activation_blocked_scopes_phase_idx on public.activation_blocked_scopes (phase_id);
create index if not exists activation_next_phases_phase_idx on public.activation_next_phases (phase_id);
create index if not exists activation_human_approvals_phase_idx on public.activation_human_approvals (phase_id);
create index if not exists activation_sync_audit_log_phase_idx on public.activation_sync_audit_log (phase_id);

drop trigger if exists set_activation_milestones_updated_at on public.activation_milestones;
create trigger set_activation_milestones_updated_at
before update on public.activation_milestones
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_phase_runs_updated_at on public.activation_phase_runs;
create trigger set_activation_phase_runs_updated_at
before update on public.activation_phase_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_tool_readiness_updated_at on public.activation_tool_readiness;
create trigger set_activation_tool_readiness_updated_at
before update on public.activation_tool_readiness
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_pr_evidence_updated_at on public.activation_pr_evidence;
create trigger set_activation_pr_evidence_updated_at
before update on public.activation_pr_evidence
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_artifact_manifests_updated_at on public.activation_artifact_manifests;
create trigger set_activation_artifact_manifests_updated_at
before update on public.activation_artifact_manifests
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_blockers_updated_at on public.activation_blockers;
create trigger set_activation_blockers_updated_at
before update on public.activation_blockers
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_allowed_scopes_updated_at on public.activation_allowed_scopes;
create trigger set_activation_allowed_scopes_updated_at
before update on public.activation_allowed_scopes
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_blocked_scopes_updated_at on public.activation_blocked_scopes;
create trigger set_activation_blocked_scopes_updated_at
before update on public.activation_blocked_scopes
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_next_phases_updated_at on public.activation_next_phases;
create trigger set_activation_next_phases_updated_at
before update on public.activation_next_phases
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_human_approvals_updated_at on public.activation_human_approvals;
create trigger set_activation_human_approvals_updated_at
before update on public.activation_human_approvals
for each row execute function public.set_updated_at();

drop trigger if exists set_activation_sync_audit_log_updated_at on public.activation_sync_audit_log;
create trigger set_activation_sync_audit_log_updated_at
before update on public.activation_sync_audit_log
for each row execute function public.set_updated_at();

alter table public.activation_milestones enable row level security;
alter table public.activation_phase_runs enable row level security;
alter table public.activation_tool_readiness enable row level security;
alter table public.activation_pr_evidence enable row level security;
alter table public.activation_artifact_manifests enable row level security;
alter table public.activation_blockers enable row level security;
alter table public.activation_allowed_scopes enable row level security;
alter table public.activation_blocked_scopes enable row level security;
alter table public.activation_next_phases enable row level security;
alter table public.activation_human_approvals enable row level security;
alter table public.activation_sync_audit_log enable row level security;

revoke all on table public.activation_milestones from public, anon, authenticated;
revoke all on table public.activation_phase_runs from public, anon, authenticated;
revoke all on table public.activation_tool_readiness from public, anon, authenticated;
revoke all on table public.activation_pr_evidence from public, anon, authenticated;
revoke all on table public.activation_artifact_manifests from public, anon, authenticated;
revoke all on table public.activation_blockers from public, anon, authenticated;
revoke all on table public.activation_allowed_scopes from public, anon, authenticated;
revoke all on table public.activation_blocked_scopes from public, anon, authenticated;
revoke all on table public.activation_next_phases from public, anon, authenticated;
revoke all on table public.activation_human_approvals from public, anon, authenticated;
revoke all on table public.activation_sync_audit_log from public, anon, authenticated;

grant select, insert, update, delete on table public.activation_milestones to service_role;
grant select, insert, update, delete on table public.activation_phase_runs to service_role;
grant select, insert, update, delete on table public.activation_tool_readiness to service_role;
grant select, insert, update, delete on table public.activation_pr_evidence to service_role;
grant select, insert, update, delete on table public.activation_artifact_manifests to service_role;
grant select, insert, update, delete on table public.activation_blockers to service_role;
grant select, insert, update, delete on table public.activation_allowed_scopes to service_role;
grant select, insert, update, delete on table public.activation_blocked_scopes to service_role;
grant select, insert, update, delete on table public.activation_next_phases to service_role;
grant select, insert, update, delete on table public.activation_human_approvals to service_role;
grant select, insert, update, delete on table public.activation_sync_audit_log to service_role;
