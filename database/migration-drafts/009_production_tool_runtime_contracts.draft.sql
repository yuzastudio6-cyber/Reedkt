-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-PROD-RUNTIME-01.

-- Purpose: production tool runtime contract tables for media analysis reports,
-- recipe definitions, execution plans, tool runs, private artifacts, quality gates,
-- fallback decisions, timeline/render manifests, model weights, and license review.
-- Core rule: production tool execution starts from approved snapshots, not raw chat.

create table if not exists media_analysis_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  source_storage_object_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  video_streams_json jsonb not null default '[]'::jsonb,
  audio_streams_json jsonb not null default '[]'::jsonb,
  proxy_json jsonb not null default '{}'::jsonb,
  keyframes_json jsonb not null default '[]'::jsonb,
  scene_analysis_json jsonb not null default '{}'::jsonb,
  speech_analysis_json jsonb not null default '{}'::jsonb,
  audio_analysis_json jsonb not null default '{}'::jsonb,
  visual_analysis_json jsonb not null default '{}'::jsonb,
  color_analysis_json jsonb not null default '{}'::jsonb,
  ocr_analysis_json jsonb not null default '{}'::jsonb,
  quality_issues_json jsonb not null default '[]'::jsonb,
  recommended_recipe_ids_json jsonb not null default '[]'::jsonb,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table media_analysis_reports is 'Draft production media analysis report table. Analysis artifacts stay private and feed approved recipe plans.';

create table if not exists tool_recipes (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null,
  version text not null,
  capability text not null,
  display_name text not null,
  description text,
  status text not null default 'draft',
  supported_intent_types_json jsonb not null default '[]'::jsonb,
  required_inputs_json jsonb not null default '[]'::jsonb,
  optional_inputs_json jsonb not null default '[]'::jsonb,
  required_analysis_json jsonb not null default '[]'::jsonb,
  primary_tool_ids_json jsonb not null default '[]'::jsonb,
  fallback_tool_ids_json jsonb not null default '[]'::jsonb,
  worker_type text not null,
  gpu_required boolean not null default false,
  estimated_cost_tier text not null default 'none',
  execution_steps_json jsonb not null default '[]'::jsonb,
  qa_checks_json jsonb not null default '[]'::jsonb,
  fallback_policy_json jsonb not null default '{}'::jsonb,
  confidence_policy_json jsonb not null default '{}'::jsonb,
  artifact_policy_json jsonb not null default '{}'::jsonb,
  timeline_integration_json jsonb not null default '{}'::jsonb,
  render_integration_json jsonb not null default '{}'::jsonb,
  approval_policy_json jsonb not null default '{}'::jsonb,
  license_policy_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_recipes_recipe_version_uidx unique (recipe_id, version),
  constraint tool_recipes_status_check check (status in ('draft', 'active', 'deprecated', 'blocked', 'evaluation_only'))
);

comment on table tool_recipes is 'Draft production recipe registry. Recipes are QA-gated pipelines, not simple tool wrappers.';

create table if not exists tool_execution_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  approved_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  edit_plan_id uuid not null,
  media_analysis_report_id uuid references media_analysis_reports(id) on delete set null,
  recipe_ids_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  requested_by uuid,
  execution_mode text not null default 'planning_only',
  worker_plan_json jsonb not null default '{}'::jsonb,
  tool_steps_json jsonb not null default '[]'::jsonb,
  expected_artifacts_json jsonb not null default '[]'::jsonb,
  required_quality_gates_json jsonb not null default '[]'::jsonb,
  fallback_plan_json jsonb not null default '{}'::jsonb,
  credit_reservation_id uuid,
  idempotency_key text not null,
  approval_required boolean not null default true,
  approved_at timestamptz,
  blocked_reason text,
  user_intent_summary text,
  approved_directive_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_execution_plans_status_check check (status in ('draft', 'waiting_approval', 'approved', 'queued', 'running', 'blocked', 'completed', 'failed', 'cancelled')),
  constraint tool_execution_plans_no_raw_prompt_check check (
    worker_plan_json::text not ilike '%rawPrompt%'
    and tool_steps_json::text not ilike '%rawPrompt%'
    and worker_plan_json::text not ilike '%raw_chat%'
    and tool_steps_json::text not ilike '%raw_chat%'
  )
);

comment on table tool_execution_plans is 'Draft production tool execution plan table. Execution requires approved_snapshot_id and structured recipe plans, not raw chat.';
comment on column tool_execution_plans.approved_snapshot_id is 'Required approved snapshot reference before any production worker can execute a tool plan.';
comment on column tool_execution_plans.user_intent_summary is 'Human-readable summary only; not raw prompt execution instructions.';
comment on column tool_execution_plans.approved_directive_summary is 'Human-readable approved directive summary only; workers execute structured approved snapshot data.';

create table if not exists tool_runs (
  id uuid primary key default gen_random_uuid(),
  tool_execution_plan_id uuid not null references tool_execution_plans(id) on delete cascade,
  tool_step_id text not null,
  recipe_id text not null,
  tool_id text not null,
  worker_type text not null,
  worker_job_id uuid,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  input_artifact_ids_json jsonb not null default '[]'::jsonb,
  output_artifact_ids_json jsonb not null default '[]'::jsonb,
  metrics_json jsonb not null default '{}'::jsonb,
  confidence numeric,
  issues_json jsonb not null default '[]'::jsonb,
  recommended_fixes_json jsonb not null default '[]'::jsonb,
  fallback_triggered boolean not null default false,
  fallback_reason text,
  approved_for_timeline boolean not null default false,
  approved_for_render boolean not null default false,
  blocked_reason text,
  tool_version text,
  model_version text,
  model_weight_manifest_id uuid,
  logs_summary text,
  error_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_runs_status_check check (status in ('queued', 'running', 'succeeded', 'failed', 'blocked', 'cancelled', 'skipped'))
);

comment on table tool_runs is 'Draft tool run result table. Logs are summaries only and must not store secrets, signed links, or raw provider payloads.';

create table if not exists tool_artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  tool_run_id uuid references tool_runs(id) on delete set null,
  artifact_type text not null,
  storage_bucket_purpose text not null,
  storage_object_path text not null,
  content_type text not null,
  size_bytes bigint,
  checksum text,
  expires_at timestamptz,
  is_private boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  preview_allowed boolean not null default false,
  source_of_truth boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tool_artifacts_private_check check (is_private = true),
  constraint tool_artifacts_source_of_truth_check check (source_of_truth = true),
  constraint tool_artifacts_storage_path_check check (
    storage_object_path <> ''
    and storage_object_path not ilike 'http://%'
    and storage_object_path not ilike 'https://%'
    and storage_object_path not ilike '%x-goog-signature=%'
    and storage_object_path not ilike '%x-amz-signature=%'
  ),
  constraint tool_artifacts_bucket_purpose_check check (storage_bucket_purpose in (
    'source_media',
    'proxy_media',
    'analysis_artifacts',
    'transcripts',
    'masks',
    'generated_assets',
    'previews',
    'final_exports',
    'worker_temp',
    'qa_artifacts'
  ))
);

comment on table tool_artifacts is 'Draft production artifacts table. Artifacts store private storage bucket purpose and object path, not persistent signed URL values.';
comment on column tool_artifacts.storage_object_path is 'Canonical private object path. Signed URLs are temporary access artifacts and must not be stored here.';

create table if not exists quality_gate_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  tool_execution_plan_id uuid not null references tool_execution_plans(id) on delete cascade,
  recipe_id text not null,
  gate_type text not null,
  status text not null default 'not_checked',
  score numeric,
  threshold numeric,
  required boolean not null default true,
  blocking boolean not null default false,
  checked_at timestamptz not null default now(),
  checked_by_worker_type text not null,
  input_artifact_ids_json jsonb not null default '[]'::jsonb,
  output_artifact_ids_json jsonb not null default '[]'::jsonb,
  issues_json jsonb not null default '[]'::jsonb,
  recommendations_json jsonb not null default '[]'::jsonb,
  fallback_required boolean not null default false,
  blocks_preview boolean not null default false,
  blocks_final_export boolean not null default false,
  human_review_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_gate_results_status_check check (status in ('not_checked', 'passed', 'warning', 'failed', 'blocked', 'needs_human_review', 'skipped'))
);

comment on table quality_gate_results is 'Draft quality gate result table. Blocking gates can prevent preview and final export readiness.';

create table if not exists fallback_decisions (
  id uuid primary key default gen_random_uuid(),
  trigger text not null,
  source_tool_run_id uuid references tool_runs(id) on delete set null,
  source_recipe_id text,
  failed_gate_ids_json jsonb not null default '[]'::jsonb,
  fallback_action text not null,
  fallback_recipe_id text,
  fallback_tool_ids_json jsonb not null default '[]'::jsonb,
  reason text not null,
  status text not null default 'proposed',
  requires_user_approval boolean not null default false,
  tool_execution_plan_id uuid references tool_execution_plans(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  media_asset_id uuid references media_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint fallback_decisions_action_check check (fallback_action in ('retry_same_tool', 'reduce_strength', 'switch_tool', 'use_simpler_recipe', 'skip_effect', 'block_preview', 'block_final_export', 'request_user_review')),
  constraint fallback_decisions_status_check check (status in ('proposed', 'approved', 'running', 'resolved', 'rejected', 'blocked'))
);

comment on table fallback_decisions is 'Draft fallback table. Fallbacks must stay inside approved snapshot policy or request user approval.';

create table if not exists timeline_manifests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_id uuid not null,
  approved_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  version text not null,
  timeline_format text not null,
  duration_seconds numeric not null,
  clips_json jsonb not null default '[]'::jsonb,
  audio_layers_json jsonb not null default '[]'::jsonb,
  caption_layers_json jsonb not null default '[]'::jsonb,
  overlay_layers_json jsonb not null default '[]'::jsonb,
  mask_layers_json jsonb not null default '[]'::jsonb,
  color_operations_json jsonb not null default '[]'::jsonb,
  render_notes_json jsonb not null default '[]'::jsonb,
  source_references_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint timeline_manifests_format_check check (timeline_format in ('reeditpro_timeline', 'opentimelineio', 'hyperframe_timeline', 'remotion_composition_manifest'))
);

comment on table timeline_manifests is 'Draft structured timeline manifest table. Timeline manifests reference approved snapshots and canonical private storage refs.';

create table if not exists render_manifests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  edit_plan_id uuid not null,
  approved_snapshot_id uuid not null references approved_plan_snapshots(id) on delete restrict,
  timeline_manifest_id uuid not null references timeline_manifests(id) on delete restrict,
  render_engine text not null,
  render_mode text not null,
  canvas_json jsonb not null default '{}'::jsonb,
  fps numeric not null,
  duration_seconds numeric not null,
  layers_json jsonb not null default '[]'::jsonb,
  assets_json jsonb not null default '[]'::jsonb,
  captions_json jsonb not null default '[]'::jsonb,
  audio_json jsonb not null default '{}'::jsonb,
  color_json jsonb not null default '{}'::jsonb,
  export_settings_json jsonb not null default '{}'::jsonb,
  required_quality_gate_ids_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint render_manifests_engine_check check (render_engine in ('hyperframe_preview', 'remotion', 'ffmpeg', 'libass', 'evaluation_revideo')),
  constraint render_manifests_status_check check (status in ('draft', 'ready', 'rendering', 'qa_blocked', 'completed', 'failed', 'cancelled'))
);

comment on table render_manifests is 'Draft render manifest table. evaluation_revideo is evaluation-only and not a core render engine.';

create table if not exists model_weight_manifests (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  model_name text not null,
  model_version text not null,
  source text not null,
  license text not null,
  commercial_use_allowed boolean not null default false,
  redistribution_allowed boolean not null default false,
  requires_attribution boolean not null default false,
  review_status text not null default 'needs_review',
  risk_notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_weight_manifests_review_status_check check (review_status in ('not_reviewed', 'needs_review', 'approved', 'blocked', 'evaluation_only'))
);

comment on table model_weight_manifests is 'Draft model weight manifest table. Model weights require commercial-use and review approval before production use.';

create table if not exists license_review_records (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  package_name text not null,
  package_version text not null,
  license text not null,
  license_family text not null,
  commercial_use_allowed boolean not null default false,
  distribution_risk text not null default 'unknown',
  network_use_risk text not null default 'unknown',
  review_status text not null default 'needs_review',
  notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint license_review_records_review_status_check check (review_status in ('not_reviewed', 'needs_review', 'approved', 'blocked', 'evaluation_only')),
  constraint license_review_records_distribution_risk_check check (distribution_risk in ('low', 'medium', 'high', 'blocked', 'unknown')),
  constraint license_review_records_network_use_risk_check check (network_use_risk in ('low', 'medium', 'high', 'blocked', 'unknown'))
);

comment on table license_review_records is 'Draft license review table. Review status is a production gate and is not legal advice.';

create index if not exists idx_media_analysis_reports_workspace on media_analysis_reports(workspace_id);
create index if not exists idx_media_analysis_reports_project on media_analysis_reports(project_id);
create index if not exists idx_media_analysis_reports_media_asset on media_analysis_reports(media_asset_id);

create index if not exists idx_tool_recipes_recipe_id on tool_recipes(recipe_id);
create index if not exists idx_tool_recipes_worker_type on tool_recipes(worker_type);

create index if not exists idx_tool_execution_plans_workspace on tool_execution_plans(workspace_id);
create index if not exists idx_tool_execution_plans_project on tool_execution_plans(project_id);
create index if not exists idx_tool_execution_plans_media_asset on tool_execution_plans(media_asset_id);
create index if not exists idx_tool_execution_plans_approved_snapshot on tool_execution_plans(approved_snapshot_id);
create index if not exists idx_tool_execution_plans_idempotency on tool_execution_plans(workspace_id, idempotency_key);

create index if not exists idx_tool_runs_execution_plan on tool_runs(tool_execution_plan_id);
create index if not exists idx_tool_runs_recipe_id on tool_runs(recipe_id);
create index if not exists idx_tool_runs_tool_id on tool_runs(tool_id);
create index if not exists idx_tool_runs_worker_job on tool_runs(worker_job_id);
create index if not exists idx_tool_runs_workspace_project on tool_runs(workspace_id, project_id);
create index if not exists idx_tool_runs_media_asset on tool_runs(media_asset_id);

create index if not exists idx_tool_artifacts_execution_run on tool_artifacts(tool_run_id);
create index if not exists idx_tool_artifacts_workspace on tool_artifacts(workspace_id);
create index if not exists idx_tool_artifacts_project on tool_artifacts(project_id);
create index if not exists idx_tool_artifacts_media_asset on tool_artifacts(media_asset_id);
create index if not exists idx_tool_artifacts_type_bucket on tool_artifacts(artifact_type, storage_bucket_purpose);

create index if not exists idx_quality_gate_results_execution_plan on quality_gate_results(tool_execution_plan_id);
create index if not exists idx_quality_gate_results_recipe_id on quality_gate_results(recipe_id);
create index if not exists idx_quality_gate_results_workspace_project on quality_gate_results(workspace_id, project_id);
create index if not exists idx_quality_gate_results_media_asset on quality_gate_results(media_asset_id);

create index if not exists idx_fallback_decisions_execution_plan on fallback_decisions(tool_execution_plan_id);
create index if not exists idx_fallback_decisions_source_recipe on fallback_decisions(source_recipe_id);
create index if not exists idx_fallback_decisions_source_tool_run on fallback_decisions(source_tool_run_id);

create index if not exists idx_timeline_manifests_workspace on timeline_manifests(workspace_id);
create index if not exists idx_timeline_manifests_project on timeline_manifests(project_id);
create index if not exists idx_timeline_manifests_media_asset on timeline_manifests(media_asset_id);
create index if not exists idx_timeline_manifests_approved_snapshot on timeline_manifests(approved_snapshot_id);

create index if not exists idx_render_manifests_workspace on render_manifests(workspace_id);
create index if not exists idx_render_manifests_project on render_manifests(project_id);
create index if not exists idx_render_manifests_approved_snapshot on render_manifests(approved_snapshot_id);
create index if not exists idx_render_manifests_timeline on render_manifests(timeline_manifest_id);

create index if not exists idx_model_weight_manifests_tool_id on model_weight_manifests(tool_id);
create index if not exists idx_model_weight_manifests_review on model_weight_manifests(review_status, commercial_use_allowed);

create index if not exists idx_license_review_records_tool_id on license_review_records(tool_id);
create index if not exists idx_license_review_records_package on license_review_records(package_name, package_version);
create index if not exists idx_license_review_records_review on license_review_records(review_status, commercial_use_allowed);
