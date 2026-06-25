-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create table if not exists public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  editing_job_id uuid references public.editing_jobs(id) on delete set null,
  approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null,
  status text not null default 'not_checked',
  summary text,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.qa_reports
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null;

create table if not exists public.qa_check_results (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references public.qa_reports(id) on delete cascade,
  category text,
  label text,
  check_name text,
  status text,
  severity text,
  fallback_actions_json jsonb not null default '[]'::jsonb,
  notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revision_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid references public.edit_sessions(id) on delete set null,
  previous_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  request_text text,
  compiled_revision_intent_json jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists public.final_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict,
  renderer_composition_plan_id text,
  export_format text,
  aspect_ratio text,
  storage_bucket text,
  storage_path text,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

alter table public.final_exports
  add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete restrict;

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.production_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  edit_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.license_review_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  tool_id text,
  review_json jsonb not null default '{}'::jsonb,
  status text,
  created_at timestamptz not null default now()
);

comment on table public.qa_reports is 'QA reports tie back to approved snapshots and jobs when execution exists.';
comment on table public.final_exports is 'Final exports tie back to approved snapshots. Storage paths are private by default.';
comment on table public.audit_events is 'Append-only audit events for approvals, worker/service activity, and security-relevant changes.';
comment on table public.production_readiness_snapshots is 'Readiness snapshots are planning records and are not legal advice.';
comment on table public.license_review_snapshots is 'Tool license/security review snapshots; provider models remain separate from open-source tools.';

create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'audit_events are append-only and cannot be updated or deleted';
end;
$$;

drop trigger if exists prevent_audit_event_update on public.audit_events;
create trigger prevent_audit_event_update before update on public.audit_events
for each row execute function public.prevent_audit_event_mutation();

drop trigger if exists prevent_audit_event_delete on public.audit_events;
create trigger prevent_audit_event_delete before delete on public.audit_events
for each row execute function public.prevent_audit_event_mutation();

create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id);
create index if not exists idx_qa_check_results_report on public.qa_check_results(qa_report_id);
create index if not exists idx_final_exports_project_snapshot on public.final_exports(project_id, approved_plan_snapshot_id);
create index if not exists idx_audit_events_project_created on public.audit_events(project_id, created_at);
create index if not exists idx_audit_events_workspace_created on public.audit_events(workspace_id, created_at);
create index if not exists idx_revision_requests_project_created on public.revision_requests(project_id, created_at);
create index if not exists idx_production_readiness_project_plan on public.production_readiness_snapshots(project_id, edit_plan_version_id);
create index if not exists idx_license_review_workspace_tool on public.license_review_snapshots(workspace_id, tool_id);
