-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: QA reports, revision requests, final exports, audit events, production readiness snapshots, and license review snapshots.
-- Hardening note: QA artifacts, browser capture artifacts, and exports can be sensitive and should be private by default.

create table if not exists qa_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_version_id uuid references edit_plan_versions(id) on delete set null,
  editing_job_id uuid references editing_jobs(id) on delete set null,
  approved_plan_snapshot_id uuid references approved_plan_snapshots(id) on delete set null,
  status text not null default 'not_checked',
  summary text,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table qa_reports is 'Draft QA report table. QA checks output against approved plan, tier policy, source order, and professional standards.';
comment on column qa_reports.approved_plan_snapshot_id is 'QA reports should tie back to the exact approved snapshot and job they evaluate.';

create table if not exists qa_check_results (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references qa_reports(id) on delete cascade,
  category text,
  label text,
  check text,
  status text,
  severity text,
  fallback_actions_json jsonb not null default '[]'::jsonb,
  notes_json jsonb not null default '[]'::jsonb
);

comment on table qa_check_results is 'Draft per-check QA result table for future structured validation and fallback review.';

create table if not exists revision_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  previous_plan_version_id uuid references edit_plan_versions(id) on delete set null,
  requested_by uuid,
  request_text text,
  compiled_revision_intent_json jsonb not null default '{}'::jsonb,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

comment on table revision_requests is 'Draft revision request table. Revisions create new plan versions instead of overwriting approved versions.';

create table if not exists final_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_version_id uuid references edit_plan_versions(id) on delete set null,
  approved_plan_snapshot_id uuid references approved_plan_snapshots(id) on delete set null,
  renderer_composition_plan_id text,
  export_format text,
  aspect_ratio text,
  storage_bucket text,
  storage_path text,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

comment on table final_exports is 'Draft final export table. Real rendering/export is future backend work and not implemented by RP-DATA-02.';
comment on column final_exports.approved_plan_snapshot_id is 'Exports should tie to approved snapshots so final output can be audited against approved plan state.';

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  actor_user_id uuid,
  event_type text,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table audit_events is 'Draft append-only audit event table. Real policies should prevent user mutation of historical events.';
comment on column audit_events.event_json is 'Append-only audit details for approval, worker, export, privacy, and security-relevant events.';

create table if not exists production_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  edit_plan_version_id uuid references edit_plan_versions(id) on delete set null,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table production_readiness_snapshots is 'Draft production readiness snapshot table. Reports are planning guidance and not legal advice.';
comment on column production_readiness_snapshots.report_json is 'May reference private QA or production readiness details and should stay project-scoped.';

create table if not exists license_review_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  tool_id text,
  review_json jsonb not null default '{}'::jsonb,
  status text,
  created_at timestamptz not null default now()
);

comment on table license_review_snapshots is 'Draft license review snapshot table. It stores review status and does not make legal conclusions.';
comment on column license_review_snapshots.review_json is 'Draft review metadata only. Do not store legal conclusions or provider secrets.';

create index if not exists idx_qa_reports_project_snapshot on qa_reports(project_id, approved_plan_snapshot_id);
create index if not exists idx_qa_check_results_report on qa_check_results(qa_report_id);
create index if not exists idx_final_exports_project_snapshot on final_exports(project_id, approved_plan_snapshot_id);
create index if not exists idx_audit_events_project_created_at on audit_events(project_id, created_at);
create index if not exists idx_revision_requests_project_created_at on revision_requests(project_id, created_at);
create index if not exists idx_production_readiness_project_plan on production_readiness_snapshots(project_id, edit_plan_version_id);
create index if not exists idx_license_review_workspace_tool on license_review_snapshots(workspace_id, tool_id);
