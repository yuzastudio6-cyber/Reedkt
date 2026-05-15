-- RP-DB-10: Render, Preview, Export, Revision + QA
-- Local-only migration for the Supabase project named `reeditpro`.
-- This migration stores render, preview, export, revision, and QA records.
-- It does not run rendering, deploy workers, call AI providers, connect to Supabase,
-- integrate Stripe, add credentials, implement uploads, or build mobile screens.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.render_job_status as enum (
    'draft',
    'awaiting_approval',
    'awaiting_credit_reservation',
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled',
    'retrying'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_type as enum (
    'preview',
    'final',
    'revision_preview',
    'export_variant',
    'test_render'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_quality_level as enum (
    'draft',
    'preview',
    'production',
    'premium'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_output_format as enum (
    'mp4',
    'webm',
    'mov',
    'png_sequence',
    'image',
    'audio',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_failure_category as enum (
    'none',
    'source_asset_missing',
    'generated_asset_missing',
    'timeline_invalid',
    'caption_collision',
    'audio_mix_failed',
    'worker_error',
    'timeout',
    'credit_not_reserved',
    'approval_missing',
    'quality_failed',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_input_type as enum (
    'source_video',
    'source_audio',
    'generated_asset',
    'caption_plan',
    'music_plan',
    'sfx_plan',
    'transition_plan',
    'stroke_motion_asset',
    'graphic_design_asset',
    'real_motion_asset',
    'soundsync_asset',
    'timeline_spec',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_status as enum (
    'draft',
    'rendering',
    'ready',
    'failed',
    'archived',
    'superseded',
    'revision_requested'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.export_status as enum (
    'draft',
    'queued',
    'exporting',
    'ready',
    'failed',
    'cancelled',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.export_format as enum (
    'mp4',
    'mov',
    'webm',
    'srt',
    'vtt',
    'wav',
    'mp3',
    'zip',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.export_platform as enum (
    'tiktok_reels_shorts',
    'youtube',
    'youtube_shorts',
    'instagram',
    'facebook',
    'linkedin',
    'website',
    'course_training',
    'client_review',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.preview_review_status as enum (
    'pending',
    'approved',
    'changes_requested',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_comment_status as enum (
    'open',
    'resolved',
    'dismissed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.revision_request_status as enum (
    'draft',
    'submitted',
    'estimating',
    'awaiting_approval',
    'approved',
    'queued',
    'in_progress',
    'completed',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.revision_scope as enum (
    'cutting',
    'caption',
    'audio',
    'music',
    'sfx',
    'transition',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'soundsync',
    'render_settings',
    'export_settings',
    'entire_edit',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.revision_cost_level as enum (
    'free',
    'low',
    'medium',
    'high',
    'premium',
    'needs_estimate'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.qa_report_status as enum (
    'pending',
    'running',
    'passed',
    'warning',
    'failed',
    'requires_retry',
    'waived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.qa_report_item_status as enum (
    'pending',
    'passed',
    'warning',
    'failed',
    'requires_retry',
    'waived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.qa_report_item_type as enum (
    'speech_clarity',
    'cut_smoothness',
    'caption_readability',
    'caption_collision',
    'music_balance',
    'sfx_balance',
    'transition_quality',
    'ambient_consistency',
    'story_flow',
    'signature_timing',
    'stroke_motion_timing',
    'real_motion_face_safe',
    'graphic_design_readability',
    'render_integrity',
    'export_settings',
    'credit_compliance',
    'user_instruction_compliance',
    'professional_standard',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  job_batch_id uuid references public.job_batches(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  status public.render_job_status not null default 'draft',
  render_type public.render_type not null default 'preview',
  quality_level public.render_quality_level not null default 'preview',
  output_format public.render_output_format not null default 'mp4',
  render_name text,
  render_description text,
  timeline_spec jsonb not null default '{}'::jsonb,
  render_settings jsonb not null default '{}'::jsonb,
  width integer,
  height integer,
  frame_rate numeric,
  duration_seconds numeric,
  estimated_credits integer,
  actual_credits integer,
  failure_category public.render_failure_category not null default 'none',
  failure_message text,
  idempotency_key text,
  worker_runtime text,
  worker_notes text,
  progress_percent numeric not null default 0,
  progress_message text,
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint render_jobs_width_positive check (width is null or width > 0),
  constraint render_jobs_height_positive check (height is null or height > 0),
  constraint render_jobs_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint render_jobs_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint render_jobs_estimated_credits_nonnegative check (estimated_credits is null or estimated_credits >= 0),
  constraint render_jobs_actual_credits_nonnegative check (actual_credits is null or actual_credits >= 0),
  constraint render_jobs_progress_percent_range check (progress_percent >= 0 and progress_percent <= 100),
  constraint render_jobs_timeline_spec_object check (jsonb_typeof(timeline_spec) = 'object'),
  constraint render_jobs_render_settings_object check (jsonb_typeof(render_settings) = 'object')
);

comment on table public.render_jobs is
'Render jobs combine approved edit plans, source assets, generated assets, captions, audio, music, SFX, and timing maps into preview or final video outputs. They should be queued only after orchestration verifies approval and credit reservation.';
comment on column public.render_jobs.credit_reservation_id is
'Reserved credit record required by future backend orchestration before expensive render jobs are queued or run.';
comment on column public.render_jobs.timeline_spec is
'Structured timeline specification for future render workers. This migration stores the spec only and does not execute rendering.';

create table public.render_job_inputs (
  id uuid primary key default gen_random_uuid(),
  render_job_id uuid not null references public.render_jobs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  input_type public.render_input_type not null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  stroke_motion_plan_id uuid references public.stroke_motion_plans(id) on delete set null,
  source_start_seconds numeric,
  source_end_seconds numeric,
  timeline_start_seconds numeric,
  timeline_end_seconds numeric,
  layer_name text,
  z_index integer,
  input_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint render_job_inputs_source_start_nonnegative check (source_start_seconds is null or source_start_seconds >= 0),
  constraint render_job_inputs_source_end_nonnegative check (source_end_seconds is null or source_end_seconds >= 0),
  constraint render_job_inputs_timeline_start_nonnegative check (timeline_start_seconds is null or timeline_start_seconds >= 0),
  constraint render_job_inputs_timeline_end_nonnegative check (timeline_end_seconds is null or timeline_end_seconds >= 0),
  constraint render_job_inputs_source_range_valid check (
    source_start_seconds is null
    or source_end_seconds is null
    or source_end_seconds >= source_start_seconds
  ),
  constraint render_job_inputs_timeline_range_valid check (
    timeline_start_seconds is null
    or timeline_end_seconds is null
    or timeline_end_seconds >= timeline_start_seconds
  )
);

comment on table public.render_job_inputs is
'Render inputs describe how source media, generated assets, captions, audio, music, SFX, Stroke Motion, Graphic Design, Real Motion, SoundSync, and timeline specs compose into preview/final renders.';

create table public.renders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  render_job_id uuid references public.render_jobs(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  status public.render_status not null default 'draft',
  render_type public.render_type not null default 'preview',
  quality_level public.render_quality_level not null default 'preview',
  output_format public.render_output_format not null default 'mp4',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  display_name text,
  storage_provider text not null default 'supabase_storage',
  storage_bucket text,
  storage_path text,
  public_url text,
  signed_url_expires_at timestamptz,
  file_size_bytes bigint,
  duration_seconds numeric,
  width integer,
  height integer,
  frame_rate numeric,
  thumbnail_media_asset_id uuid references public.media_assets(id) on delete set null,
  preview_chat_message_id uuid references public.chat_messages(id) on delete set null,
  preview_inline_chat_card_id uuid references public.inline_chat_cards(id) on delete set null,
  supersedes_render_id uuid references public.renders(id) on delete set null,
  render_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint renders_file_size_nonnegative check (file_size_bytes is null or file_size_bytes >= 0),
  constraint renders_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint renders_width_positive check (width is null or width > 0),
  constraint renders_height_positive check (height is null or height > 0),
  constraint renders_frame_rate_positive check (frame_rate is null or frame_rate > 0)
);

comment on table public.renders is
'Preview, revision preview, final, or test render outputs. Renders are full preview/final video outputs and are separate from generated intermediate assets.';
comment on column public.renders.preview_inline_chat_card_id is
'Inline chat card used to show preview-ready results inside the chat-native editor.';
comment on column public.renders.storage_path is
'Storage object path only. Do not store credentials or long-lived signed URLs here.';

create table public.render_events (
  id uuid primary key default gen_random_uuid(),
  render_job_id uuid references public.render_jobs(id) on delete cascade,
  render_id uuid references public.renders(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  message text,
  status public.render_job_status,
  progress_percent numeric,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint render_events_progress_percent_range check (progress_percent is null or (progress_percent >= 0 and progress_percent <= 100))
);

comment on table public.render_events is
'Append-style event history for render jobs and render outputs. Events are progress/audit records and do not execute rendering.';

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  status public.export_status not null default 'draft',
  export_platform public.export_platform not null default 'custom',
  export_format public.export_format not null default 'mp4',
  display_name text,
  export_settings jsonb not null default '{}'::jsonb,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  storage_provider text not null default 'supabase_storage',
  storage_bucket text,
  storage_path text,
  public_url text,
  signed_url_expires_at timestamptz,
  file_size_bytes bigint,
  duration_seconds numeric,
  width integer,
  height integer,
  frame_rate numeric,
  requested_by uuid references public.user_profiles(id) on delete set null,
  requested_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exports_file_size_nonnegative check (file_size_bytes is null or file_size_bytes >= 0),
  constraint exports_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint exports_width_positive check (width is null or width > 0),
  constraint exports_height_positive check (height is null or height > 0),
  constraint exports_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint exports_export_settings_object check (jsonb_typeof(export_settings) = 'object')
);

comment on table public.exports is
'Final export requests/results. Exports should happen after render readiness, QA, preview approval when required, and any needed credit approval.';

create table public.export_variants (
  id uuid primary key default gen_random_uuid(),
  export_id uuid not null references public.exports(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  variant_name text not null,
  export_platform public.export_platform not null default 'custom',
  export_format public.export_format not null default 'mp4',
  aspect_ratio public.aspect_ratio,
  width integer,
  height integer,
  frame_rate numeric,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  storage_path text,
  variant_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint export_variants_width_positive check (width is null or width > 0),
  constraint export_variants_height_positive check (height is null or height > 0),
  constraint export_variants_frame_rate_positive check (frame_rate is null or frame_rate > 0)
);

comment on table public.export_variants is
'Platform or format variants for a final export, such as Shorts, Reels, website, captions, audio, or client review deliverables.';

create table public.preview_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  render_id uuid not null references public.renders(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  status public.preview_review_status not null default 'pending',
  reviewed_by uuid references public.user_profiles(id) on delete set null,
  review_note text,
  approved_at timestamptz,
  changes_requested_at timestamptz,
  rejected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.preview_reviews is
'Preview review records allow approval, rejection, or revision requests to happen inside the chat-native editor.';

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  preview_review_id uuid references public.preview_reviews(id) on delete cascade,
  render_id uuid references public.renders(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  author_user_id uuid references public.user_profiles(id) on delete set null,
  status public.review_comment_status not null default 'open',
  timecode_seconds numeric,
  comment_text text not null,
  assigned_to uuid references public.user_profiles(id) on delete set null,
  priority text not null default 'normal',
  resolved_at timestamptz,
  resolved_by uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_comments_timecode_nonnegative check (timecode_seconds is null or timecode_seconds >= 0),
  constraint review_comments_priority_check check (priority in ('low', 'normal', 'high', 'urgent'))
);

comment on table public.review_comments is
'Timestamped preview review comments, usually created from chat or review UI and optionally resolved by future editors/workers.';

create table public.revision_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  chat_action_id uuid references public.chat_actions(id) on delete set null,
  preview_review_id uuid references public.preview_reviews(id) on delete set null,
  review_comment_id uuid references public.review_comments(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  new_edit_plan_id uuid references public.edit_plans(id) on delete set null,
  status public.revision_request_status not null default 'submitted',
  revision_scope public.revision_scope not null default 'other',
  cost_level public.revision_cost_level not null default 'needs_estimate',
  requested_by uuid references public.user_profiles(id) on delete set null,
  requested_change text not null,
  requires_new_generation boolean not null default false,
  requires_new_render boolean not null default true,
  estimated_extra_credits integer,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  worker_notes text,
  revision_payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint revision_requests_estimated_extra_credits_nonnegative check (estimated_extra_credits is null or estimated_extra_credits >= 0)
);

comment on table public.revision_requests is
'Structured revision requests from chat or preview review. Revisions may require new planning, generation, credits, or render work.';
comment on column public.revision_requests.requires_new_generation is
'True when a revision needs new generated assets such as Stroke Motion, Graphic Design, Real Motion, SoundSync, captions, music, or SFX.';
comment on column public.revision_requests.estimated_extra_credits is
'Estimated extra Reedit Credits for the revision. Expensive revision generation should get a new estimate and approval before work begins.';

create table public.revision_request_items (
  id uuid primary key default gen_random_uuid(),
  revision_request_id uuid not null references public.revision_requests(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  revision_scope public.revision_scope not null,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  stroke_motion_plan_id uuid references public.stroke_motion_plans(id) on delete set null,
  render_input_id uuid references public.render_job_inputs(id) on delete set null,
  timecode_seconds numeric,
  description text,
  requires_new_generation boolean not null default false,
  requires_new_render boolean not null default true,
  item_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint revision_request_items_timecode_nonnegative check (timecode_seconds is null or timecode_seconds >= 0)
);

comment on table public.revision_request_items is
'Affected segments, signature routes, generated assets, Stroke Motion plans, render inputs, or timecodes for a revision request.';

create table public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  render_job_id uuid references public.render_jobs(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  export_id uuid references public.exports(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  status public.qa_report_status not null default 'pending',
  overall_score numeric,
  summary text,
  requires_retry boolean not null default false,
  checked_by text,
  qa_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qa_reports_overall_score_range check (overall_score is null or (overall_score >= 0 and overall_score <= 100))
);

comment on table public.qa_reports is
'Full QA reports for render, preview, export, and revision readiness. QA determines whether a preview/export is good enough to show or deliver.';
comment on column public.qa_reports.requires_retry is
'When true, future backend workers should repair or retry before showing the preview or allowing export.';

create table public.qa_report_items (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references public.qa_reports(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  check_type public.qa_report_item_type not null,
  status public.qa_report_item_status not null default 'pending',
  score numeric,
  issue text,
  recommendation text,
  requires_retry boolean not null default false,
  timecode_seconds numeric,
  related_generated_asset_id uuid references public.generated_assets(id) on delete set null,
  related_render_input_id uuid references public.render_job_inputs(id) on delete set null,
  item_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qa_report_items_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint qa_report_items_timecode_nonnegative check (timecode_seconds is null or timecode_seconds >= 0)
);

comment on table public.qa_report_items is
'Individual QA checks for speech, cuts, captions, music, SFX, transitions, ambience, story flow, signature timing, render integrity, credit compliance, user instructions, and professional standard.';
comment on column public.qa_report_items.check_type is
'Specific QA dimension checked before a preview is shown or an export is delivered.';

create or replace view public.project_latest_preview_view
with (security_invoker = true) as
select distinct on (r.project_id)
  r.project_id,
  r.workspace_id,
  r.id as render_id,
  r.status,
  r.render_type,
  r.media_asset_id,
  r.public_url,
  r.storage_path,
  r.created_at
from public.renders r
where r.render_type in ('preview', 'revision_preview')
  and r.archived_at is null
order by r.project_id, r.created_at desc;

comment on view public.project_latest_preview_view is
'Latest non-archived preview or revision preview per project for chat/dashboard reads. This view does not render video.';

create or replace function public.can_export_render(target_render_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.renders r
    where r.id = target_render_id
      and r.status = 'ready'
      and (auth.role() = 'service_role' or public.is_workspace_member(r.workspace_id))
      and not exists (
        select 1
        from public.preview_reviews pr
        where pr.render_id = r.id
          and pr.status in ('pending', 'changes_requested', 'rejected')
      )
      and exists (
        select 1
        from public.qa_reports qr
        where qr.render_id = r.id
          and qr.status in ('passed', 'warning', 'waived')
          and qr.requires_retry = false
      )
      and not exists (
        select 1
        from public.qa_reports qr_blocking
        where qr_blocking.render_id = r.id
          and (qr_blocking.status in ('failed', 'requires_retry') or qr_blocking.requires_retry = true)
      )
  );
$$;

comment on function public.can_export_render(uuid) is
'Read-only helper for future backend/export gates. Returns true only for ready renders without blocking preview reviews and with passing/non-blocking QA.';

create index render_jobs_workspace_id_idx on public.render_jobs (workspace_id);
create index render_jobs_project_id_idx on public.render_jobs (project_id);
create index render_jobs_chat_session_id_idx on public.render_jobs (chat_session_id);
create index render_jobs_chat_message_id_idx on public.render_jobs (chat_message_id);
create index render_jobs_edit_plan_id_idx on public.render_jobs (edit_plan_id);
create index render_jobs_job_id_idx on public.render_jobs (job_id);
create index render_jobs_job_batch_id_idx on public.render_jobs (job_batch_id);
create index render_jobs_credit_estimate_id_idx on public.render_jobs (credit_estimate_id);
create index render_jobs_credit_reservation_id_idx on public.render_jobs (credit_reservation_id);
create index render_jobs_status_idx on public.render_jobs (status);
create index render_jobs_render_type_idx on public.render_jobs (render_type);
create index render_jobs_quality_level_idx on public.render_jobs (quality_level);
create index render_jobs_output_format_idx on public.render_jobs (output_format);
create index render_jobs_queued_at_idx on public.render_jobs (queued_at);
create index render_jobs_started_at_idx on public.render_jobs (started_at);
create index render_jobs_completed_at_idx on public.render_jobs (completed_at);
create index render_jobs_failed_at_idx on public.render_jobs (failed_at);
create unique index render_jobs_idempotency_key_uidx
on public.render_jobs (idempotency_key)
where idempotency_key is not null;

create index render_job_inputs_render_job_id_idx on public.render_job_inputs (render_job_id);
create index render_job_inputs_workspace_id_idx on public.render_job_inputs (workspace_id);
create index render_job_inputs_project_id_idx on public.render_job_inputs (project_id);
create index render_job_inputs_input_type_idx on public.render_job_inputs (input_type);
create index render_job_inputs_media_asset_id_idx on public.render_job_inputs (media_asset_id);
create index render_job_inputs_generated_asset_id_idx on public.render_job_inputs (generated_asset_id);
create index render_job_inputs_segment_id_idx on public.render_job_inputs (edit_plan_segment_id);
create index render_job_inputs_signature_route_id_idx on public.render_job_inputs (signature_route_id);
create index render_job_inputs_stroke_motion_plan_id_idx on public.render_job_inputs (stroke_motion_plan_id);
create index render_job_inputs_timeline_start_seconds_idx on public.render_job_inputs (timeline_start_seconds);
create index render_job_inputs_z_index_idx on public.render_job_inputs (z_index);

create index renders_workspace_id_idx on public.renders (workspace_id);
create index renders_project_id_idx on public.renders (project_id);
create index renders_chat_session_id_idx on public.renders (chat_session_id);
create index renders_edit_plan_id_idx on public.renders (edit_plan_id);
create index renders_render_job_id_idx on public.renders (render_job_id);
create index renders_job_id_idx on public.renders (job_id);
create index renders_status_idx on public.renders (status);
create index renders_render_type_idx on public.renders (render_type);
create index renders_quality_level_idx on public.renders (quality_level);
create index renders_output_format_idx on public.renders (output_format);
create index renders_media_asset_id_idx on public.renders (media_asset_id);
create index renders_generated_asset_id_idx on public.renders (generated_asset_id);
create index renders_preview_chat_message_id_idx on public.renders (preview_chat_message_id);
create index renders_preview_inline_chat_card_id_idx on public.renders (preview_inline_chat_card_id);
create index renders_supersedes_render_id_idx on public.renders (supersedes_render_id);
create index renders_archived_at_idx on public.renders (archived_at);

create index render_events_render_job_id_idx on public.render_events (render_job_id);
create index render_events_render_id_idx on public.render_events (render_id);
create index render_events_workspace_id_idx on public.render_events (workspace_id);
create index render_events_project_id_idx on public.render_events (project_id);
create index render_events_event_type_idx on public.render_events (event_type);
create index render_events_status_idx on public.render_events (status);
create index render_events_created_at_idx on public.render_events (created_at);

create index exports_workspace_id_idx on public.exports (workspace_id);
create index exports_project_id_idx on public.exports (project_id);
create index exports_chat_session_id_idx on public.exports (chat_session_id);
create index exports_chat_message_id_idx on public.exports (chat_message_id);
create index exports_render_id_idx on public.exports (render_id);
create index exports_edit_plan_id_idx on public.exports (edit_plan_id);
create index exports_job_id_idx on public.exports (job_id);
create index exports_status_idx on public.exports (status);
create index exports_platform_idx on public.exports (export_platform);
create index exports_format_idx on public.exports (export_format);
create index exports_media_asset_id_idx on public.exports (media_asset_id);
create index exports_requested_by_idx on public.exports (requested_by);
create index exports_requested_at_idx on public.exports (requested_at);
create index exports_completed_at_idx on public.exports (completed_at);
create index exports_failed_at_idx on public.exports (failed_at);

create index export_variants_export_id_idx on public.export_variants (export_id);
create index export_variants_workspace_id_idx on public.export_variants (workspace_id);
create index export_variants_project_id_idx on public.export_variants (project_id);
create index export_variants_platform_idx on public.export_variants (export_platform);
create index export_variants_format_idx on public.export_variants (export_format);
create index export_variants_aspect_ratio_idx on public.export_variants (aspect_ratio);
create index export_variants_media_asset_id_idx on public.export_variants (media_asset_id);

create index preview_reviews_workspace_id_idx on public.preview_reviews (workspace_id);
create index preview_reviews_project_id_idx on public.preview_reviews (project_id);
create index preview_reviews_chat_session_id_idx on public.preview_reviews (chat_session_id);
create index preview_reviews_render_id_idx on public.preview_reviews (render_id);
create index preview_reviews_edit_plan_id_idx on public.preview_reviews (edit_plan_id);
create index preview_reviews_status_idx on public.preview_reviews (status);
create index preview_reviews_reviewed_by_idx on public.preview_reviews (reviewed_by);
create index preview_reviews_approved_at_idx on public.preview_reviews (approved_at);
create index preview_reviews_changes_requested_at_idx on public.preview_reviews (changes_requested_at);

create index review_comments_workspace_id_idx on public.review_comments (workspace_id);
create index review_comments_project_id_idx on public.review_comments (project_id);
create index review_comments_preview_review_id_idx on public.review_comments (preview_review_id);
create index review_comments_render_id_idx on public.review_comments (render_id);
create index review_comments_chat_session_id_idx on public.review_comments (chat_session_id);
create index review_comments_chat_message_id_idx on public.review_comments (chat_message_id);
create index review_comments_author_user_id_idx on public.review_comments (author_user_id);
create index review_comments_status_idx on public.review_comments (status);
create index review_comments_timecode_seconds_idx on public.review_comments (timecode_seconds);
create index review_comments_assigned_to_idx on public.review_comments (assigned_to);
create index review_comments_resolved_at_idx on public.review_comments (resolved_at);

create index revision_requests_workspace_id_idx on public.revision_requests (workspace_id);
create index revision_requests_project_id_idx on public.revision_requests (project_id);
create index revision_requests_chat_session_id_idx on public.revision_requests (chat_session_id);
create index revision_requests_chat_message_id_idx on public.revision_requests (chat_message_id);
create index revision_requests_chat_action_id_idx on public.revision_requests (chat_action_id);
create index revision_requests_preview_review_id_idx on public.revision_requests (preview_review_id);
create index revision_requests_review_comment_id_idx on public.revision_requests (review_comment_id);
create index revision_requests_render_id_idx on public.revision_requests (render_id);
create index revision_requests_edit_plan_id_idx on public.revision_requests (edit_plan_id);
create index revision_requests_new_edit_plan_id_idx on public.revision_requests (new_edit_plan_id);
create index revision_requests_status_idx on public.revision_requests (status);
create index revision_requests_scope_idx on public.revision_requests (revision_scope);
create index revision_requests_cost_level_idx on public.revision_requests (cost_level);
create index revision_requests_requested_by_idx on public.revision_requests (requested_by);
create index revision_requests_requires_new_generation_idx on public.revision_requests (requires_new_generation);
create index revision_requests_requires_new_render_idx on public.revision_requests (requires_new_render);
create index revision_requests_credit_estimate_id_idx on public.revision_requests (credit_estimate_id);
create index revision_requests_credit_reservation_id_idx on public.revision_requests (credit_reservation_id);
create index revision_requests_submitted_at_idx on public.revision_requests (submitted_at);
create index revision_requests_completed_at_idx on public.revision_requests (completed_at);

create index revision_request_items_revision_request_id_idx on public.revision_request_items (revision_request_id);
create index revision_request_items_workspace_id_idx on public.revision_request_items (workspace_id);
create index revision_request_items_project_id_idx on public.revision_request_items (project_id);
create index revision_request_items_scope_idx on public.revision_request_items (revision_scope);
create index revision_request_items_segment_id_idx on public.revision_request_items (edit_plan_segment_id);
create index revision_request_items_signature_route_id_idx on public.revision_request_items (signature_route_id);
create index revision_request_items_generated_asset_id_idx on public.revision_request_items (generated_asset_id);
create index revision_request_items_stroke_motion_plan_id_idx on public.revision_request_items (stroke_motion_plan_id);
create index revision_request_items_render_input_id_idx on public.revision_request_items (render_input_id);
create index revision_request_items_timecode_seconds_idx on public.revision_request_items (timecode_seconds);

create index qa_reports_workspace_id_idx on public.qa_reports (workspace_id);
create index qa_reports_project_id_idx on public.qa_reports (project_id);
create index qa_reports_edit_plan_id_idx on public.qa_reports (edit_plan_id);
create index qa_reports_render_job_id_idx on public.qa_reports (render_job_id);
create index qa_reports_render_id_idx on public.qa_reports (render_id);
create index qa_reports_export_id_idx on public.qa_reports (export_id);
create index qa_reports_job_id_idx on public.qa_reports (job_id);
create index qa_reports_agent_run_id_idx on public.qa_reports (agent_run_id);
create index qa_reports_status_idx on public.qa_reports (status);
create index qa_reports_requires_retry_idx on public.qa_reports (requires_retry);
create index qa_reports_completed_at_idx on public.qa_reports (completed_at);

create index qa_report_items_qa_report_id_idx on public.qa_report_items (qa_report_id);
create index qa_report_items_workspace_id_idx on public.qa_report_items (workspace_id);
create index qa_report_items_project_id_idx on public.qa_report_items (project_id);
create index qa_report_items_segment_id_idx on public.qa_report_items (edit_plan_segment_id);
create index qa_report_items_check_type_idx on public.qa_report_items (check_type);
create index qa_report_items_status_idx on public.qa_report_items (status);
create index qa_report_items_requires_retry_idx on public.qa_report_items (requires_retry);
create index qa_report_items_timecode_seconds_idx on public.qa_report_items (timecode_seconds);
create index qa_report_items_related_generated_asset_id_idx on public.qa_report_items (related_generated_asset_id);
create index qa_report_items_related_render_input_id_idx on public.qa_report_items (related_render_input_id);

create trigger render_jobs_set_updated_at
before update on public.render_jobs
for each row execute function public.set_updated_at();

create trigger renders_set_updated_at
before update on public.renders
for each row execute function public.set_updated_at();

create trigger exports_set_updated_at
before update on public.exports
for each row execute function public.set_updated_at();

create trigger export_variants_set_updated_at
before update on public.export_variants
for each row execute function public.set_updated_at();

create trigger preview_reviews_set_updated_at
before update on public.preview_reviews
for each row execute function public.set_updated_at();

create trigger review_comments_set_updated_at
before update on public.review_comments
for each row execute function public.set_updated_at();

create trigger revision_requests_set_updated_at
before update on public.revision_requests
for each row execute function public.set_updated_at();

create trigger qa_reports_set_updated_at
before update on public.qa_reports
for each row execute function public.set_updated_at();

create trigger qa_report_items_set_updated_at
before update on public.qa_report_items
for each row execute function public.set_updated_at();

alter table public.render_jobs enable row level security;
alter table public.render_job_inputs enable row level security;
alter table public.renders enable row level security;
alter table public.render_events enable row level security;
alter table public.exports enable row level security;
alter table public.export_variants enable row level security;
alter table public.preview_reviews enable row level security;
alter table public.review_comments enable row level security;
alter table public.revision_requests enable row level security;
alter table public.revision_request_items enable row level security;
alter table public.qa_reports enable row level security;
alter table public.qa_report_items enable row level security;

create policy render_jobs_select_member
on public.render_jobs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy render_jobs_insert_editor
on public.render_jobs for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy render_jobs_update_editor
on public.render_jobs for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy render_jobs_delete_owner_admin
on public.render_jobs for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy render_job_inputs_select_member
on public.render_job_inputs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy render_job_inputs_insert_editor
on public.render_job_inputs for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy render_job_inputs_update_editor
on public.render_job_inputs for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy render_job_inputs_delete_owner_admin
on public.render_job_inputs for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy renders_select_member
on public.renders for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy renders_insert_editor
on public.renders for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy renders_update_editor
on public.renders for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy renders_delete_owner_admin
on public.renders for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy render_events_select_member
on public.render_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy render_events_insert_editor
on public.render_events for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy exports_select_member
on public.exports for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy exports_insert_editor
on public.exports for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy exports_update_editor
on public.exports for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy exports_delete_owner_admin
on public.exports for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy export_variants_select_member
on public.export_variants for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy export_variants_insert_editor
on public.export_variants for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy export_variants_update_editor
on public.export_variants for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy preview_reviews_select_member
on public.preview_reviews for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy preview_reviews_insert_editor
on public.preview_reviews for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy preview_reviews_update_editor
on public.preview_reviews for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy review_comments_select_member
on public.review_comments for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy review_comments_insert_editor
on public.review_comments for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy review_comments_update_editor
on public.review_comments for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy revision_requests_select_member
on public.revision_requests for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy revision_requests_insert_editor
on public.revision_requests for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy revision_requests_update_editor
on public.revision_requests for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy revision_request_items_select_member
on public.revision_request_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy revision_request_items_insert_editor
on public.revision_request_items for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy revision_request_items_update_editor
on public.revision_request_items for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy qa_reports_select_member
on public.qa_reports for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy qa_reports_insert_editor
on public.qa_reports for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy qa_reports_update_editor
on public.qa_reports for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy qa_report_items_select_member
on public.qa_report_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy qa_report_items_insert_editor
on public.qa_report_items for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy qa_report_items_update_editor
on public.qa_report_items for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

grant usage on type public.render_job_status to authenticated, service_role;
grant usage on type public.render_type to authenticated, service_role;
grant usage on type public.render_quality_level to authenticated, service_role;
grant usage on type public.render_output_format to authenticated, service_role;
grant usage on type public.render_failure_category to authenticated, service_role;
grant usage on type public.render_input_type to authenticated, service_role;
grant usage on type public.render_status to authenticated, service_role;
grant usage on type public.export_status to authenticated, service_role;
grant usage on type public.export_format to authenticated, service_role;
grant usage on type public.export_platform to authenticated, service_role;
grant usage on type public.preview_review_status to authenticated, service_role;
grant usage on type public.review_comment_status to authenticated, service_role;
grant usage on type public.revision_request_status to authenticated, service_role;
grant usage on type public.revision_scope to authenticated, service_role;
grant usage on type public.revision_cost_level to authenticated, service_role;
grant usage on type public.qa_report_status to authenticated, service_role;
grant usage on type public.qa_report_item_status to authenticated, service_role;
grant usage on type public.qa_report_item_type to authenticated, service_role;

revoke all on table public.render_jobs from public, anon;
revoke all on table public.render_job_inputs from public, anon;
revoke all on table public.renders from public, anon;
revoke all on table public.render_events from public, anon;
revoke all on table public.exports from public, anon;
revoke all on table public.export_variants from public, anon;
revoke all on table public.preview_reviews from public, anon;
revoke all on table public.review_comments from public, anon;
revoke all on table public.revision_requests from public, anon;
revoke all on table public.revision_request_items from public, anon;
revoke all on table public.qa_reports from public, anon;
revoke all on table public.qa_report_items from public, anon;
revoke all on table public.project_latest_preview_view from public, anon;
revoke execute on function public.can_export_render(uuid) from public, anon;

grant select, insert, update, delete on table public.render_jobs to authenticated;
grant select, insert, update, delete on table public.render_job_inputs to authenticated;
grant select, insert, update, delete on table public.renders to authenticated;
grant select, insert on table public.render_events to authenticated;
grant select, insert, update, delete on table public.exports to authenticated;
grant select, insert, update on table public.export_variants to authenticated;
grant select, insert, update on table public.preview_reviews to authenticated;
grant select, insert, update on table public.review_comments to authenticated;
grant select, insert, update on table public.revision_requests to authenticated;
grant select, insert, update on table public.revision_request_items to authenticated;
grant select, insert, update on table public.qa_reports to authenticated;
grant select, insert, update on table public.qa_report_items to authenticated;
grant select on table public.project_latest_preview_view to authenticated;
grant execute on function public.can_export_render(uuid) to authenticated;

grant select, insert, update, delete on table public.render_jobs to service_role;
grant select, insert, update, delete on table public.render_job_inputs to service_role;
grant select, insert, update, delete on table public.renders to service_role;
grant select, insert, update, delete on table public.render_events to service_role;
grant select, insert, update, delete on table public.exports to service_role;
grant select, insert, update, delete on table public.export_variants to service_role;
grant select, insert, update, delete on table public.preview_reviews to service_role;
grant select, insert, update, delete on table public.review_comments to service_role;
grant select, insert, update, delete on table public.revision_requests to service_role;
grant select, insert, update, delete on table public.revision_request_items to service_role;
grant select, insert, update, delete on table public.qa_reports to service_role;
grant select, insert, update, delete on table public.qa_report_items to service_role;
grant select on table public.project_latest_preview_view to service_role;
grant execute on function public.can_export_render(uuid) to service_role;
