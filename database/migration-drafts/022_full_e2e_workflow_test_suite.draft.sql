-- Draft migration notes for Milestone 16B full E2E production workflow test suite.
-- This draft documents review targets only. Do not apply without Supabase migration review.

comment on schema public is
  'M16B drafts production E2E workflow run/stage/artifact/QA/blocker summaries. E2E uses approved snapshots, private artifacts, generated fixture-only local-dev media, no signed URLs, no raw prompt execution, no providers, and no model downloads.';

create table if not exists production_e2e_workflow_runs (
  id uuid primary key,
  scenario_id text not null,
  mode text not null,
  status text not null,
  approved_snapshot_id uuid,
  tool_execution_plan_id uuid,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_e2e_stage_results (
  id uuid primary key,
  workflow_run_id uuid not null,
  stage text not null,
  status text not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_e2e_artifact_summaries (
  id uuid primary key,
  workflow_run_id uuid not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_e2e_qa_summaries (
  id uuid primary key,
  workflow_run_id uuid not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists production_e2e_blocker_summaries (
  id uuid primary key,
  workflow_run_id uuid not null,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

comment on table production_e2e_workflow_runs is
  'M16B production workflow test run summaries. No signed_url or raw_prompt columns are allowed; use IDs and private artifact refs only.';

comment on table production_e2e_stage_results is
  'Per-stage E2E result summaries for dry-run/static/local-dev generated fixture validation.';

comment on table production_e2e_artifact_summaries is
  'Artifact handoff summaries, including producer/consumer stage tracking, source immutability, private final exports, and generated fixture cleanup metadata.';

comment on table production_e2e_qa_summaries is
  'Cross-stage QA summaries. final_delivery remains blocked unless private final_export exists and blocking gates pass.';

comment on table production_e2e_blocker_summaries is
  'Readiness/model/manual-review/fallback blocker summaries. Production-ready E2E remains blocked while M12 blockers exist.';
