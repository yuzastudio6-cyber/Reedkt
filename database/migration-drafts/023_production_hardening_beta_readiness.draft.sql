-- Draft migration notes for Milestone 17 production hardening and beta readiness.
-- This draft documents review targets only. Do not apply without Supabase migration review.

comment on schema public is
  'M17 drafts production hardening, security review, cost control, beta readiness, incident, kill switch, audit, and retention policy records. Production/external beta remains blocked; no signed_url, raw_prompt, or secret_value columns are allowed.';

create table if not exists production_hardening_reports (
  id uuid primary key,
  status text not null,
  scorecard jsonb not null,
  blockers jsonb not null,
  warnings jsonb not null,
  manual_review_items jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_security_review_reports (
  id uuid primary key,
  status text not null,
  findings jsonb not null,
  blockers jsonb not null,
  warnings jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_cost_control_reports (
  id uuid primary key,
  status text not null,
  summary jsonb not null,
  blockers jsonb not null,
  warnings jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists beta_readiness_reports (
  id uuid primary key,
  status text not null,
  checklist jsonb not null,
  scenario_matrix jsonb not null,
  blockers jsonb not null,
  warnings jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_incident_events (
  id uuid primary key,
  incident_type text not null,
  severity text not null,
  sanitized_summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_kill_switch_events (
  id uuid primary key,
  switch_name text not null,
  action text not null,
  actor_id uuid,
  sanitized_summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_audit_events (
  id uuid primary key,
  event_type text not null,
  actor_type text not null,
  workspace_id uuid,
  project_id uuid,
  sanitized_summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists artifact_retention_policies (
  id uuid primary key,
  retention_class text not null,
  default_private boolean not null default true,
  retention_days integer not null,
  deletion_eligible boolean not null default true,
  user_deletion_behavior text not null,
  temp_cleanup_behavior text not null,
  created_at timestamptz not null default now()
);

comment on table production_hardening_reports is
  'M17 hardening scorecard records. Status remains blocked until human deployment, readiness, model/license, security, cost, privacy, and legal approvals pass.';

comment on table production_security_review_reports is
  'Security review summaries for secret safety, signed URL safety, raw prompt execution blocking, frontend/backend boundaries, model weights, tool execution, and storage privacy.';

comment on table production_cost_control_reports is
  'Static cost/concurrency/rate/timeout/kill-switch summaries. Does not enable production GPU, render, or provider execution.';

comment on table beta_readiness_reports is
  'Beta readiness checklist and scenario matrix. External beta, real user media beta, and paid production remain blocked by default.';

comment on table production_audit_events is
  'Sanitized audit events only. No secrets, raw prompts, auth headers, cookies, signed URLs, or sensitive local paths.';

comment on table artifact_retention_policies is
  'Private retention classes for source media, proxies, analysis, transcripts, masks, generated assets, previews, final exports, worker temp, and QA artifacts.';
