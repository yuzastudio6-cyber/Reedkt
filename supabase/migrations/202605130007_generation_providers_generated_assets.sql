-- RP-DB-09: Generation Providers + Generated Assets
-- Local-only migration for the Supabase project named `reeditpro`.
-- This migration stores provider metadata, generation requests, generated assets,
-- and timing/cost records. It does not call providers, store credentials, render
-- video, deploy Google Cloud workers, or create render/export/revision/QA tables.

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
  create type public.generation_provider_type as enum (
    'wan',
    'veo',
    'kling',
    'remotion',
    'svg_renderer',
    'lottie_renderer',
    'google_cloud_worker',
    'custom_deterministic_renderer',
    'external_ai_provider',
    'human',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_runtime_type as enum (
    'backend_api',
    'cloud_run_service',
    'cloud_run_job',
    'gpu_worker',
    'external_api',
    'supabase_edge_function',
    'local_mock',
    'human',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_capability as enum (
    'text_to_image',
    'image_to_image',
    'text_to_video',
    'image_to_video',
    'video_to_video',
    'audio_generation',
    'music_generation',
    'sfx_generation',
    'caption_generation',
    'svg_generation',
    'lottie_generation',
    'remotion_render',
    'transparent_overlay',
    'image_sequence',
    'timeline_spec',
    'json_spec',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_request_type as enum (
    'stroke_motion_animation',
    'stroke_motion_storyboard',
    'graphic_design_overlay',
    'real_motion_overlay',
    'soundsync_audio',
    'caption_asset',
    'transition_asset',
    'music_asset',
    'sfx_asset',
    'preview_asset',
    'style_reference',
    'animation_reference',
    'json_spec',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_request_status as enum (
    'draft',
    'awaiting_approval',
    'approved',
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled',
    'retrying',
    'revision_requested'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generated_asset_type as enum (
    'stroke_motion_overlay',
    'graphic_design_overlay',
    'real_motion_overlay',
    'sound_effect',
    'music',
    'voice_audio',
    'caption_file',
    'svg',
    'lottie_json',
    'remotion_scene',
    'transparent_video',
    'image',
    'image_sequence',
    'video',
    'json_spec',
    'preview_asset',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generated_asset_status as enum (
    'draft',
    'generating',
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
  create type public.generated_asset_format as enum (
    'svg',
    'json',
    'lottie',
    'remotion',
    'mp4',
    'webm',
    'mov',
    'png',
    'jpg',
    'webp',
    'wav',
    'mp3',
    'srt',
    'vtt',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_quality_level as enum (
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
  create type public.generation_failure_category as enum (
    'none',
    'provider_error',
    'timeout',
    'invalid_prompt',
    'unsafe_output',
    'asset_missing',
    'credit_not_reserved',
    'approval_missing',
    'worker_error',
    'quality_failed',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_input_role as enum (
    'source_video',
    'source_frame',
    'source_audio',
    'reference_video',
    'reference_image',
    'style_reference',
    'stroke_motion_plan',
    'stroke_motion_beat',
    'edit_plan_segment',
    'signature_route',
    'prompt_context',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

create table public.generation_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  name text not null,
  provider_type public.generation_provider_type not null,
  runtime_type public.generation_runtime_type not null default 'external_api',
  description text,
  is_active boolean not null default true,
  supports_video boolean not null default false,
  supports_image boolean not null default false,
  supports_audio boolean not null default false,
  supports_transparent_background boolean not null default false,
  supports_svg boolean not null default false,
  supports_lottie boolean not null default false,
  supports_remotion boolean not null default false,
  supports_word_level_timing boolean not null default false,
  supports_style_reference boolean not null default false,
  gpu_required boolean not null default false,
  secret_reference_name text,
  worker_runtime_config_id uuid references public.worker_runtime_configs(id) on delete set null,
  cost_multiplier numeric not null default 1,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_providers_cost_multiplier_nonnegative check (cost_multiplier >= 0)
);

comment on table public.generation_providers is
'Provider metadata for future AI or deterministic generation. Provider rows store only capabilities and secret reference names, never real API keys or credentials.';
comment on column public.generation_providers.secret_reference_name is
'Reference label for a future secret manager entry. Do not store API keys, service role keys, provider credentials, signed URLs, or raw secrets in this column.';
comment on column public.generation_providers.worker_runtime_config_id is
'Optional link to future Google Cloud worker runtime configuration. The database stores references only and does not deploy workers.';

create table public.generation_provider_capabilities (
  id uuid primary key default gen_random_uuid(),
  generation_provider_id uuid not null references public.generation_providers(id) on delete cascade,
  capability public.generation_capability not null,
  is_supported boolean not null default true,
  max_duration_seconds numeric,
  max_width integer,
  max_height integer,
  supports_transparency boolean not null default false,
  supports_timing_constraints boolean not null default false,
  supports_prompt_weights boolean not null default false,
  capability_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint generation_provider_capabilities_duration_nonnegative check (max_duration_seconds is null or max_duration_seconds >= 0),
  constraint generation_provider_capabilities_max_width_positive check (max_width is null or max_width > 0),
  constraint generation_provider_capabilities_max_height_positive check (max_height is null or max_height > 0),
  unique (generation_provider_id, capability)
);

comment on table public.generation_provider_capabilities is
'Capability rows for provider routing. They let future orchestration choose deterministic renderers, AI providers, audio providers, or workers without hard-coding one provider.';

create table public.generation_provider_models (
  id uuid primary key default gen_random_uuid(),
  generation_provider_id uuid not null references public.generation_providers(id) on delete cascade,
  model_key text not null,
  model_name text not null,
  display_name text,
  description text,
  is_active boolean not null default true,
  default_quality_level public.generation_quality_level not null default 'preview',
  default_credit_cost integer,
  cost_per_second_credits numeric,
  cost_per_request_credits numeric,
  max_duration_seconds numeric,
  max_resolution text,
  supports_transparent_background boolean not null default false,
  supports_word_level_timing boolean not null default false,
  supports_seed boolean not null default false,
  model_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_provider_models_default_credit_cost_nonnegative check (default_credit_cost is null or default_credit_cost >= 0),
  constraint generation_provider_models_cost_per_second_nonnegative check (cost_per_second_credits is null or cost_per_second_credits >= 0),
  constraint generation_provider_models_cost_per_request_nonnegative check (cost_per_request_credits is null or cost_per_request_credits >= 0),
  constraint generation_provider_models_duration_nonnegative check (max_duration_seconds is null or max_duration_seconds >= 0),
  unique (generation_provider_id, model_key)
);

comment on table public.generation_provider_models is
'Provider model/config rows. Model records describe future routing and cost defaults without storing credentials or calling providers.';

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  stroke_motion_plan_id uuid references public.stroke_motion_plans(id) on delete set null,
  stroke_motion_beat_id uuid references public.stroke_motion_beats(id) on delete set null,
  stroke_motion_generation_spec_id uuid references public.stroke_motion_generation_specs(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  credit_reservation_id uuid references public.credit_reservations(id) on delete set null,
  generation_provider_id uuid references public.generation_providers(id) on delete set null,
  generation_provider_model_id uuid references public.generation_provider_models(id) on delete set null,
  request_type public.generation_request_type not null,
  status public.generation_request_status not null default 'draft',
  quality_level public.generation_quality_level not null default 'preview',
  signature_system public.signature_system not null default 'none',
  provider_type public.generation_provider_type,
  model_name text,
  prompt text,
  negative_prompt text,
  style_constraints jsonb not null default '{}'::jsonb,
  timing_constraints jsonb not null default '{}'::jsonb,
  output_requirements jsonb not null default '{}'::jsonb,
  transparent_background_required boolean not null default false,
  word_level_timing_required boolean not null default false,
  duration_seconds numeric,
  width integer,
  height integer,
  frame_rate numeric,
  seed text,
  estimated_credits integer,
  actual_credits integer,
  failure_category public.generation_failure_category not null default 'none',
  failure_message text,
  idempotency_key text,
  provider_request_id text,
  provider_response_payload jsonb not null default '{}'::jsonb,
  worker_notes text,
  request_payload jsonb not null default '{}'::jsonb,
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_requests_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint generation_requests_width_positive check (width is null or width > 0),
  constraint generation_requests_height_positive check (height is null or height > 0),
  constraint generation_requests_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint generation_requests_estimated_credits_nonnegative check (estimated_credits is null or estimated_credits >= 0),
  constraint generation_requests_actual_credits_nonnegative check (actual_credits is null or actual_credits >= 0),
  constraint generation_requests_style_constraints_object check (jsonb_typeof(style_constraints) = 'object'),
  constraint generation_requests_timing_constraints_object check (jsonb_typeof(timing_constraints) = 'object'),
  constraint generation_requests_output_requirements_object check (jsonb_typeof(output_requirements) = 'object')
);

comment on table public.generation_requests is
'Requests for AI or deterministic generation. Generation should only be queued after edit plan approval and credit reservation in backend orchestration.';
comment on column public.generation_requests.credit_reservation_id is
'Reserved credit record that future backend orchestration must require before queued/running generation. SQL stores the link; workers enforce the gate.';
comment on column public.generation_requests.transparent_background_required is
'True when the output must composite as an overlay, especially for Stroke Motion, Graphic Design, Real Motion, captions, and visual explainers.';
comment on column public.generation_requests.word_level_timing_required is
'True when generation must align to transcript words, source reading, Stroke Motion timing anchors, or precise caption/audio timing.';
comment on column public.generation_requests.provider_response_payload is
'Sanitized provider response metadata only. Do not store raw credentials, private signed URLs, or secrets.';

create table public.generation_request_inputs (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid not null references public.generation_requests(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  input_role public.generation_input_role not null default 'other',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  stroke_motion_plan_id uuid references public.stroke_motion_plans(id) on delete set null,
  stroke_motion_beat_id uuid references public.stroke_motion_beats(id) on delete set null,
  source_start_seconds numeric,
  source_end_seconds numeric,
  input_text text,
  input_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint generation_request_inputs_source_start_nonnegative check (source_start_seconds is null or source_start_seconds >= 0),
  constraint generation_request_inputs_source_end_nonnegative check (source_end_seconds is null or source_end_seconds >= 0),
  constraint generation_request_inputs_source_range_valid check (
    source_start_seconds is null
    or source_end_seconds is null
    or source_end_seconds >= source_start_seconds
  )
);

comment on table public.generation_request_inputs is
'Inputs attached to a generation request, including media assets, source frames/audio, edit plan segments, signature routes, Stroke Motion plans/beats, and prompt context.';

create table public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  created_by_user_id uuid references public.user_profiles(id) on delete set null,
  asset_type public.generated_asset_type not null,
  asset_status public.generated_asset_status not null default 'draft',
  asset_format public.generated_asset_format not null default 'unknown',
  quality_level public.generation_quality_level not null default 'preview',
  signature_system public.signature_system not null default 'none',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  file_name text,
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
  transparent_background boolean not null default false,
  word_level_timing boolean not null default false,
  usable_for_render boolean not null default false,
  supersedes_generated_asset_id uuid references public.generated_assets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint generated_assets_file_size_nonnegative check (file_size_bytes is null or file_size_bytes >= 0),
  constraint generated_assets_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint generated_assets_width_positive check (width is null or width > 0),
  constraint generated_assets_height_positive check (height is null or height > 0),
  constraint generated_assets_frame_rate_positive check (frame_rate is null or frame_rate > 0)
);

comment on table public.generated_assets is
'Generated outputs from provider or worker requests. These are intermediate or reusable assets for future render jobs, not final exports.';
comment on column public.generated_assets.usable_for_render is
'Marks whether the generated asset passed enough checks to be considered by a future render job. It is not itself a final render approval.';
comment on column public.generated_assets.storage_path is
'Storage object path only. Do not store credentials, provider secrets, or long-lived signed URLs here.';

create table public.generated_asset_versions (
  id uuid primary key default gen_random_uuid(),
  generated_asset_id uuid not null references public.generated_assets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  version_label text,
  change_reason text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint generated_asset_versions_version_positive check (version_number > 0),
  unique (generated_asset_id, version_number)
);

comment on table public.generated_asset_versions is
'Version history for generated assets so revisions can supersede earlier provider outputs without losing audit history.';

create table public.generated_asset_timing_maps (
  id uuid primary key default gen_random_uuid(),
  generated_asset_id uuid not null references public.generated_assets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  stroke_motion_plan_id uuid references public.stroke_motion_plans(id) on delete set null,
  start_time_seconds numeric,
  end_time_seconds numeric,
  timeline_offset_seconds numeric not null default 0,
  timing_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generated_asset_timing_maps_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint generated_asset_timing_maps_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint generated_asset_timing_maps_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  )
);

comment on table public.generated_asset_timing_maps is
'Timing data for generated overlays, captions, Stroke Motion, SoundSync, and future timeline synchronization.';

create table public.generation_events (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid not null references public.generation_requests(id) on delete cascade,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  message text,
  status public.generation_request_status,
  progress_percent numeric,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint generation_events_progress_percent_range check (progress_percent is null or (progress_percent >= 0 and progress_percent <= 100))
);

comment on table public.generation_events is
'Append-style event history for generation requests and generated assets. Events are audit/progress records, not provider execution code.';

create table public.generation_request_costs (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid not null references public.generation_requests(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  estimated_internal_cost_cents integer,
  actual_internal_cost_cents integer,
  estimated_user_credits integer,
  actual_user_credits integer,
  cost_reason text,
  cost_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_request_costs_estimated_internal_nonnegative check (estimated_internal_cost_cents is null or estimated_internal_cost_cents >= 0),
  constraint generation_request_costs_actual_internal_nonnegative check (actual_internal_cost_cents is null or actual_internal_cost_cents >= 0),
  constraint generation_request_costs_estimated_credits_nonnegative check (estimated_user_credits is null or estimated_user_credits >= 0),
  constraint generation_request_costs_actual_credits_nonnegative check (actual_user_credits is null or actual_user_credits >= 0)
);

comment on table public.generation_request_costs is
'Estimated and actual provider/internal cost tracking for generation requests. Internal provider costs are separate from user-facing Reedit Credits.';

insert into public.generation_providers (
  provider_key,
  name,
  provider_type,
  runtime_type,
  description,
  supports_video,
  supports_image,
  supports_audio,
  supports_transparent_background,
  supports_svg,
  supports_lottie,
  supports_remotion,
  supports_word_level_timing,
  supports_style_reference,
  gpu_required,
  cost_multiplier,
  provider_payload
)
values
  (
    'remotion_renderer',
    'Remotion Renderer Placeholder',
    'remotion',
    'cloud_run_job',
    'Placeholder deterministic renderer for future timeline/spec driven animation and overlay generation.',
    true,
    true,
    false,
    true,
    false,
    false,
    true,
    true,
    false,
    false,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  ),
  (
    'svg_renderer',
    'SVG Renderer Placeholder',
    'svg_renderer',
    'cloud_run_service',
    'Placeholder deterministic SVG renderer for transparent Stroke Motion overlays and visual explainers.',
    false,
    true,
    false,
    true,
    true,
    false,
    false,
    true,
    false,
    false,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  ),
  (
    'lottie_renderer',
    'Lottie Renderer Placeholder',
    'lottie_renderer',
    'cloud_run_service',
    'Placeholder deterministic Lottie renderer for editable animation specs and transparent overlays.',
    false,
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
    false,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  ),
  (
    'google_cloud_worker',
    'Google Cloud Worker Placeholder',
    'google_cloud_worker',
    'cloud_run_job',
    'Placeholder for future Cloud Run Jobs, GPU workers, Pub/Sub orchestration, and Artifact Registry containers.',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    1,
    '{"integration_status":"placeholder","stores_secrets":false,"secret_source":"secret_manager_reference_only"}'::jsonb
  ),
  (
    'wan_placeholder',
    'Wan Placeholder',
    'wan',
    'external_api',
    'Placeholder provider option for future AI video/image generation. No active integration or credentials.',
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  ),
  (
    'veo_placeholder',
    'Veo Placeholder',
    'veo',
    'external_api',
    'Placeholder provider option for future AI video generation. No active integration or credentials.',
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  ),
  (
    'kling_placeholder',
    'Kling Placeholder',
    'kling',
    'external_api',
    'Placeholder provider option for future AI video/image generation. No active integration or credentials.',
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    1,
    '{"integration_status":"placeholder","stores_secrets":false}'::jsonb
  )
on conflict (provider_key) do nothing;

insert into public.generation_provider_capabilities (
  generation_provider_id,
  capability,
  supports_transparency,
  supports_timing_constraints,
  supports_prompt_weights,
  capability_payload
)
select gp.id, capability, supports_transparency, supports_timing_constraints, supports_prompt_weights, payload
from public.generation_providers gp
cross join lateral (
  values
    ('remotion_renderer', 'remotion_render'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('remotion_renderer', 'timeline_spec'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('svg_renderer', 'svg_generation'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('svg_renderer', 'transparent_overlay'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('lottie_renderer', 'lottie_generation'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('google_cloud_worker', 'transparent_overlay'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('google_cloud_worker', 'json_spec'::public.generation_capability, true, true, false, '{"placeholder":true}'::jsonb),
    ('wan_placeholder', 'text_to_video'::public.generation_capability, false, false, true, '{"placeholder":true}'::jsonb),
    ('veo_placeholder', 'text_to_video'::public.generation_capability, false, false, true, '{"placeholder":true}'::jsonb),
    ('kling_placeholder', 'image_to_video'::public.generation_capability, false, false, true, '{"placeholder":true}'::jsonb)
) as seed(provider_key, capability, supports_transparency, supports_timing_constraints, supports_prompt_weights, payload)
where gp.provider_key = seed.provider_key
on conflict (generation_provider_id, capability) do nothing;

insert into public.generation_provider_models (
  generation_provider_id,
  model_key,
  model_name,
  display_name,
  description,
  default_quality_level,
  supports_transparent_background,
  supports_word_level_timing,
  supports_seed,
  model_payload
)
select gp.id, model_key, model_name, display_name, description, default_quality_level, supports_transparent_background, supports_word_level_timing, supports_seed, payload
from public.generation_providers gp
cross join lateral (
  values
    ('remotion_renderer', 'remotion_spec_v1', 'remotion_spec_v1', 'Remotion Spec v1', 'Placeholder deterministic Remotion spec renderer.', 'preview'::public.generation_quality_level, true, true, true, '{"placeholder":true}'::jsonb),
    ('svg_renderer', 'svg_overlay_v1', 'svg_overlay_v1', 'SVG Overlay v1', 'Placeholder deterministic SVG overlay renderer.', 'preview'::public.generation_quality_level, true, true, true, '{"placeholder":true}'::jsonb),
    ('lottie_renderer', 'lottie_overlay_v1', 'lottie_overlay_v1', 'Lottie Overlay v1', 'Placeholder deterministic Lottie overlay renderer.', 'preview'::public.generation_quality_level, true, true, true, '{"placeholder":true}'::jsonb),
    ('google_cloud_worker', 'worker_routed_v1', 'worker_routed_v1', 'Worker Routed v1', 'Placeholder model key for future Google Cloud worker routing.', 'preview'::public.generation_quality_level, true, true, false, '{"placeholder":true}'::jsonb),
    ('wan_placeholder', 'wan_placeholder_model', 'wan_placeholder_model', 'Wan Placeholder Model', 'Non-integrated placeholder for future Wan routing.', 'draft'::public.generation_quality_level, false, false, true, '{"placeholder":true}'::jsonb),
    ('veo_placeholder', 'veo_placeholder_model', 'veo_placeholder_model', 'Veo Placeholder Model', 'Non-integrated placeholder for future Veo routing.', 'draft'::public.generation_quality_level, false, false, true, '{"placeholder":true}'::jsonb),
    ('kling_placeholder', 'kling_placeholder_model', 'kling_placeholder_model', 'Kling Placeholder Model', 'Non-integrated placeholder for future Kling routing.', 'draft'::public.generation_quality_level, false, false, true, '{"placeholder":true}'::jsonb)
) as seed(provider_key, model_key, model_name, display_name, description, default_quality_level, supports_transparent_background, supports_word_level_timing, supports_seed, payload)
where gp.provider_key = seed.provider_key
on conflict (generation_provider_id, model_key) do nothing;

create index generation_providers_provider_key_idx on public.generation_providers (provider_key);
create index generation_providers_provider_type_idx on public.generation_providers (provider_type);
create index generation_providers_runtime_type_idx on public.generation_providers (runtime_type);
create index generation_providers_is_active_idx on public.generation_providers (is_active);
create index generation_providers_worker_runtime_config_id_idx on public.generation_providers (worker_runtime_config_id);
create index generation_providers_gpu_required_idx on public.generation_providers (gpu_required);

create index generation_provider_capabilities_provider_id_idx on public.generation_provider_capabilities (generation_provider_id);
create index generation_provider_capabilities_capability_idx on public.generation_provider_capabilities (capability);
create index generation_provider_capabilities_is_supported_idx on public.generation_provider_capabilities (is_supported);

create index generation_provider_models_provider_id_idx on public.generation_provider_models (generation_provider_id);
create index generation_provider_models_model_key_idx on public.generation_provider_models (model_key);
create index generation_provider_models_is_active_idx on public.generation_provider_models (is_active);
create index generation_provider_models_quality_level_idx on public.generation_provider_models (default_quality_level);

create index generation_requests_workspace_id_idx on public.generation_requests (workspace_id);
create index generation_requests_project_id_idx on public.generation_requests (project_id);
create index generation_requests_chat_session_id_idx on public.generation_requests (chat_session_id);
create index generation_requests_chat_message_id_idx on public.generation_requests (chat_message_id);
create index generation_requests_edit_plan_id_idx on public.generation_requests (edit_plan_id);
create index generation_requests_segment_id_idx on public.generation_requests (edit_plan_segment_id);
create index generation_requests_signature_route_id_idx on public.generation_requests (signature_route_id);
create index generation_requests_stroke_motion_plan_id_idx on public.generation_requests (stroke_motion_plan_id);
create index generation_requests_stroke_motion_beat_id_idx on public.generation_requests (stroke_motion_beat_id);
create index generation_requests_stroke_motion_generation_spec_id_idx on public.generation_requests (stroke_motion_generation_spec_id);
create index generation_requests_job_id_idx on public.generation_requests (job_id);
create index generation_requests_agent_run_id_idx on public.generation_requests (agent_run_id);
create index generation_requests_credit_estimate_id_idx on public.generation_requests (credit_estimate_id);
create index generation_requests_credit_reservation_id_idx on public.generation_requests (credit_reservation_id);
create index generation_requests_provider_id_idx on public.generation_requests (generation_provider_id);
create index generation_requests_model_id_idx on public.generation_requests (generation_provider_model_id);
create index generation_requests_request_type_idx on public.generation_requests (request_type);
create index generation_requests_status_idx on public.generation_requests (status);
create index generation_requests_quality_level_idx on public.generation_requests (quality_level);
create index generation_requests_signature_system_idx on public.generation_requests (signature_system);
create index generation_requests_provider_request_id_idx on public.generation_requests (provider_request_id);
create index generation_requests_queued_at_idx on public.generation_requests (queued_at);
create index generation_requests_started_at_idx on public.generation_requests (started_at);
create index generation_requests_completed_at_idx on public.generation_requests (completed_at);
create index generation_requests_failed_at_idx on public.generation_requests (failed_at);
create unique index generation_requests_idempotency_key_uidx
on public.generation_requests (idempotency_key)
where idempotency_key is not null;

create index generation_request_inputs_request_id_idx on public.generation_request_inputs (generation_request_id);
create index generation_request_inputs_workspace_id_idx on public.generation_request_inputs (workspace_id);
create index generation_request_inputs_project_id_idx on public.generation_request_inputs (project_id);
create index generation_request_inputs_input_role_idx on public.generation_request_inputs (input_role);
create index generation_request_inputs_media_asset_id_idx on public.generation_request_inputs (media_asset_id);
create index generation_request_inputs_segment_id_idx on public.generation_request_inputs (edit_plan_segment_id);
create index generation_request_inputs_signature_route_id_idx on public.generation_request_inputs (signature_route_id);
create index generation_request_inputs_stroke_motion_plan_id_idx on public.generation_request_inputs (stroke_motion_plan_id);
create index generation_request_inputs_stroke_motion_beat_id_idx on public.generation_request_inputs (stroke_motion_beat_id);

create index generated_assets_workspace_id_idx on public.generated_assets (workspace_id);
create index generated_assets_project_id_idx on public.generated_assets (project_id);
create index generated_assets_generation_request_id_idx on public.generated_assets (generation_request_id);
create index generated_assets_job_id_idx on public.generated_assets (job_id);
create index generated_assets_agent_run_id_idx on public.generated_assets (agent_run_id);
create index generated_assets_created_by_user_id_idx on public.generated_assets (created_by_user_id);
create index generated_assets_asset_type_idx on public.generated_assets (asset_type);
create index generated_assets_asset_status_idx on public.generated_assets (asset_status);
create index generated_assets_asset_format_idx on public.generated_assets (asset_format);
create index generated_assets_quality_level_idx on public.generated_assets (quality_level);
create index generated_assets_signature_system_idx on public.generated_assets (signature_system);
create index generated_assets_media_asset_id_idx on public.generated_assets (media_asset_id);
create index generated_assets_storage_path_idx on public.generated_assets (storage_path);
create index generated_assets_usable_for_render_idx on public.generated_assets (usable_for_render);
create index generated_assets_supersedes_generated_asset_id_idx on public.generated_assets (supersedes_generated_asset_id);
create index generated_assets_archived_at_idx on public.generated_assets (archived_at);

create index generated_asset_versions_generated_asset_id_idx on public.generated_asset_versions (generated_asset_id);
create index generated_asset_versions_workspace_id_idx on public.generated_asset_versions (workspace_id);
create index generated_asset_versions_project_id_idx on public.generated_asset_versions (project_id);
create index generated_asset_versions_generation_request_id_idx on public.generated_asset_versions (generation_request_id);
create index generated_asset_versions_version_number_idx on public.generated_asset_versions (version_number);

create index generated_asset_timing_maps_generated_asset_id_idx on public.generated_asset_timing_maps (generated_asset_id);
create index generated_asset_timing_maps_workspace_id_idx on public.generated_asset_timing_maps (workspace_id);
create index generated_asset_timing_maps_project_id_idx on public.generated_asset_timing_maps (project_id);
create index generated_asset_timing_maps_edit_plan_id_idx on public.generated_asset_timing_maps (edit_plan_id);
create index generated_asset_timing_maps_segment_id_idx on public.generated_asset_timing_maps (edit_plan_segment_id);
create index generated_asset_timing_maps_stroke_motion_plan_id_idx on public.generated_asset_timing_maps (stroke_motion_plan_id);
create index generated_asset_timing_maps_start_time_idx on public.generated_asset_timing_maps (start_time_seconds);
create index generated_asset_timing_maps_end_time_idx on public.generated_asset_timing_maps (end_time_seconds);

create index generation_events_request_id_idx on public.generation_events (generation_request_id);
create index generation_events_generated_asset_id_idx on public.generation_events (generated_asset_id);
create index generation_events_workspace_id_idx on public.generation_events (workspace_id);
create index generation_events_project_id_idx on public.generation_events (project_id);
create index generation_events_event_type_idx on public.generation_events (event_type);
create index generation_events_status_idx on public.generation_events (status);
create index generation_events_created_at_idx on public.generation_events (created_at);

create index generation_request_costs_request_id_idx on public.generation_request_costs (generation_request_id);
create index generation_request_costs_workspace_id_idx on public.generation_request_costs (workspace_id);
create index generation_request_costs_project_id_idx on public.generation_request_costs (project_id);

create trigger generation_providers_set_updated_at
before update on public.generation_providers
for each row execute function public.set_updated_at();

create trigger generation_provider_models_set_updated_at
before update on public.generation_provider_models
for each row execute function public.set_updated_at();

create trigger generation_requests_set_updated_at
before update on public.generation_requests
for each row execute function public.set_updated_at();

create trigger generated_assets_set_updated_at
before update on public.generated_assets
for each row execute function public.set_updated_at();

create trigger generated_asset_timing_maps_set_updated_at
before update on public.generated_asset_timing_maps
for each row execute function public.set_updated_at();

create trigger generation_request_costs_set_updated_at
before update on public.generation_request_costs
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stroke_motion_generation_specs_generation_request_id_fkey'
      and conrelid = 'public.stroke_motion_generation_specs'::regclass
  ) then
    alter table public.stroke_motion_generation_specs
    add constraint stroke_motion_generation_specs_generation_request_id_fkey
    foreign key (generation_request_id) references public.generation_requests(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signature_routes_generation_request_id_fkey'
      and conrelid = 'public.signature_routes'::regclass
  ) then
    alter table public.signature_routes
    add constraint signature_routes_generation_request_id_fkey
    foreign key (generation_request_id) references public.generation_requests(id) on delete set null;
  end if;
end $$;

alter table public.generation_providers enable row level security;
alter table public.generation_provider_capabilities enable row level security;
alter table public.generation_provider_models enable row level security;
alter table public.generation_requests enable row level security;
alter table public.generation_request_inputs enable row level security;
alter table public.generated_assets enable row level security;
alter table public.generated_asset_versions enable row level security;
alter table public.generated_asset_timing_maps enable row level security;
alter table public.generation_events enable row level security;
alter table public.generation_request_costs enable row level security;

create policy generation_providers_select_active
on public.generation_providers for select
to authenticated
using (is_active = true);

create policy generation_provider_capabilities_select_active_provider
on public.generation_provider_capabilities for select
to authenticated
using (
  exists (
    select 1
    from public.generation_providers gp
    where gp.id = generation_provider_id
      and gp.is_active = true
  )
);

create policy generation_provider_models_select_active
on public.generation_provider_models for select
to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.generation_providers gp
    where gp.id = generation_provider_id
      and gp.is_active = true
  )
);

create policy generation_requests_select_member
on public.generation_requests for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generation_requests_insert_owner_admin
on public.generation_requests for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generation_requests_update_owner_admin
on public.generation_requests for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generation_request_inputs_select_member
on public.generation_request_inputs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generation_request_inputs_insert_owner_admin
on public.generation_request_inputs for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generated_assets_select_member
on public.generated_assets for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generated_assets_insert_owner_admin
on public.generated_assets for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generated_assets_update_owner_admin
on public.generated_assets for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generated_asset_versions_select_member
on public.generated_asset_versions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generated_asset_versions_insert_owner_admin
on public.generated_asset_versions for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generated_asset_timing_maps_select_member
on public.generated_asset_timing_maps for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generated_asset_timing_maps_insert_owner_admin
on public.generated_asset_timing_maps for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generated_asset_timing_maps_update_owner_admin
on public.generated_asset_timing_maps for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generation_events_select_member
on public.generation_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generation_events_insert_owner_admin
on public.generation_events for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generation_request_costs_select_member
on public.generation_request_costs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generation_request_costs_insert_owner_admin
on public.generation_request_costs for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy generation_request_costs_update_owner_admin
on public.generation_request_costs for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

grant usage on type public.generation_provider_type to authenticated, service_role;
grant usage on type public.generation_runtime_type to authenticated, service_role;
grant usage on type public.generation_capability to authenticated, service_role;
grant usage on type public.generation_request_type to authenticated, service_role;
grant usage on type public.generation_request_status to authenticated, service_role;
grant usage on type public.generated_asset_type to authenticated, service_role;
grant usage on type public.generated_asset_status to authenticated, service_role;
grant usage on type public.generated_asset_format to authenticated, service_role;
grant usage on type public.generation_quality_level to authenticated, service_role;
grant usage on type public.generation_failure_category to authenticated, service_role;
grant usage on type public.generation_input_role to authenticated, service_role;

revoke all on table public.generation_providers from public, anon;
revoke all on table public.generation_provider_capabilities from public, anon;
revoke all on table public.generation_provider_models from public, anon;
revoke all on table public.generation_requests from public, anon;
revoke all on table public.generation_request_inputs from public, anon;
revoke all on table public.generated_assets from public, anon;
revoke all on table public.generated_asset_versions from public, anon;
revoke all on table public.generated_asset_timing_maps from public, anon;
revoke all on table public.generation_events from public, anon;
revoke all on table public.generation_request_costs from public, anon;

grant select on table public.generation_providers to authenticated;
grant select on table public.generation_provider_capabilities to authenticated;
grant select on table public.generation_provider_models to authenticated;
grant select, insert, update on table public.generation_requests to authenticated;
grant select, insert on table public.generation_request_inputs to authenticated;
grant select, insert, update on table public.generated_assets to authenticated;
grant select, insert on table public.generated_asset_versions to authenticated;
grant select, insert, update on table public.generated_asset_timing_maps to authenticated;
grant select, insert on table public.generation_events to authenticated;
grant select, insert, update on table public.generation_request_costs to authenticated;

grant select, insert, update, delete on table public.generation_providers to service_role;
grant select, insert, update, delete on table public.generation_provider_capabilities to service_role;
grant select, insert, update, delete on table public.generation_provider_models to service_role;
grant select, insert, update, delete on table public.generation_requests to service_role;
grant select, insert, update, delete on table public.generation_request_inputs to service_role;
grant select, insert, update, delete on table public.generated_assets to service_role;
grant select, insert, update, delete on table public.generated_asset_versions to service_role;
grant select, insert, update, delete on table public.generated_asset_timing_maps to service_role;
grant select, insert, update, delete on table public.generation_events to service_role;
grant select, insert, update, delete on table public.generation_request_costs to service_role;
