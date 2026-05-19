-- RP-SFX-03 - SoundSync SFX Director Tables
-- Local schema artifact only. Do not run against production until reviewed and tested.
-- This migration does not call providers, store secrets, deploy Google Cloud, render media, or connect to remote Supabase.

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
  create type public.sfx_decision_state as enum (
    'needed',
    'optional',
    'not_needed',
    'avoid',
    'needs_user_confirmation'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_target_layer as enum (
    'transition',
    'title_card',
    'chapter_card',
    'graphic_design',
    'stroke_motion',
    'real_motion',
    'caption_emphasis',
    'montage_hit',
    'cta_reveal',
    'ambient_bridge',
    'ui_feedback',
    'source_footage_repair',
    'none'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_provider as enum (
    'reeditpro_internal_library',
    'mmaudio_v',
    'mirelo_sfx_v1_5',
    'no_sfx',
    'manual_upload',
    'unknown'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_provider_role as enum (
    'internal_library_first_choice',
    'cheap_draft_fallback',
    'basic_pro_fallback',
    'production_final',
    'premium_signature',
    'none'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_prompt_style as enum (
    'simple_keyword',
    'short_phrase',
    'tag_list',
    'structured_sentence',
    'video_conditioned_short_prompt',
    'library_search_tags'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_anchor_type as enum (
    'cut',
    'music_beat',
    'music_downbeat',
    'title_reveal',
    'chapter_card_reveal',
    'graphic_reveal',
    'stroke_motion_start',
    'stroke_motion_completion',
    'stroke_motion_morph',
    'real_motion_object_enter',
    'real_motion_object_settle',
    'caption_keyword',
    'cta_reveal',
    'camera_movement',
    'gesture',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_timing_priority as enum (
    'frame_accurate',
    'beat_aligned',
    'speech_safe',
    'loose_background',
    'manual_review'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_volume_profile as enum (
    'none',
    'whisper',
    'subtle_polish',
    'standard_social',
    'impact',
    'premium_soft'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_mix_priority as enum (
    'voice_first',
    'ambience_first',
    'music_support',
    'effect_moment',
    'signature_sync',
    'low_priority'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_generation_status as enum (
    'draft',
    'planned',
    'awaiting_approval',
    'approved',
    'queued',
    'generating',
    'generated',
    'trimmed',
    'aligned',
    'mixed',
    'qa_pending',
    'qa_passed',
    'qa_failed',
    'used_in_preview',
    'used_in_export',
    'cancelled',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_reuse_status as enum (
    'project_generated',
    'approved_for_project',
    'candidate_for_library',
    'reuse_review',
    'approved_internal_library',
    'workspace_only',
    'blocked_from_reuse',
    'requires_terms_review'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_qa_status as enum (
    'pending',
    'passed',
    'warning',
    'failed',
    'requires_trim_adjustment',
    'requires_mix_adjustment',
    'requires_regeneration',
    'remove_sfx',
    'waived'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_qa_issue_type as enum (
    'too_loud',
    'too_quiet',
    'late_hit',
    'early_hit',
    'wrong_style',
    'sounds_cheap',
    'cartoonish_when_should_be_premium',
    'fights_voice',
    'fights_music',
    'tail_too_long',
    'audio_artifact',
    'bad_trim',
    'bad_hit_alignment',
    'repeats_too_often',
    'not_needed',
    'does_not_match_edit_layer',
    'does_not_match_user_instruction',
    'provider_output_low_quality',
    'license_or_provenance_missing',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_qa_recommended_action as enum (
    'use',
    'use_with_mix_adjustment',
    'trim_again',
    'lower_volume',
    'regenerate',
    'replace_with_library',
    'remove_sfx',
    'ask_user'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_source_footage_policy as enum (
    'edit_layer_only_default',
    'allow_source_repair',
    'allow_full_sound_design',
    'user_requested_source_sfx',
    'avoid_source_action_sfx'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_generated_duration_policy as enum (
    'generate_2_to_3_seconds',
    'generate_3_to_5_seconds',
    'generate_6_to_8_seconds',
    'custom'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_use_case as enum (
    'transition',
    'stroke_motion_draw',
    'graphic_reveal',
    'real_motion_object',
    'chapter_title',
    'comedic_hit',
    'ambient_bridge',
    'soft_whoosh',
    'light_hit',
    'success_chime',
    'paper_swipe',
    'transition_soft_whoosh',
    'transition_camera_swipe',
    'transition_air_pass',
    'transition_light_riser',
    'transition_ambient_bridge',
    'transition_subtle_cut_accent',
    'transition_dip_to_black_swell',
    'stroke_draw',
    'stroke_line_trace',
    'stroke_soft_pencil_draw',
    'stroke_sketch_texture',
    'stroke_symbol_pop',
    'stroke_circle_complete',
    'stroke_line_crack',
    'stroke_line_reconnect',
    'stroke_light_shimmer',
    'graphic_card_reveal',
    'graphic_label_pop',
    'graphic_diagram_trace',
    'graphic_line_draw',
    'graphic_list_item_tick',
    'graphic_data_point_reveal',
    'graphic_subtle_click',
    'real_motion_object_enter',
    'real_motion_object_settle',
    'real_motion_soft_impact',
    'real_motion_paper_movement',
    'real_motion_glass_movement',
    'real_motion_wood_movement',
    'real_motion_cloth_movement',
    'lifestyle_travel_whoosh',
    'lifestyle_camera_shutter',
    'lifestyle_water_boat_ambience',
    'lifestyle_restaurant_ambience_bridge',
    'cta_success_chime',
    'cta_light_tap',
    'cta_clean_resolve_hit',
    'cta_subtle_shimmer',
    'montage_beat_accent',
    'ambient_soft_bridge',
    'source_footage_repair',
    'none',
    'custom'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_asset_origin as enum (
    'mock_generated',
    'provider_generated',
    'project_generated',
    'internal_library',
    'workspace_library',
    'manual_upload',
    'source_audio',
    'licensed_library',
    'unknown'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_license_scope as enum (
    'project_only',
    'workspace_only',
    'approved_internal_library',
    'commercial_allowed',
    'ads_allowed',
    'terms_review_required',
    'blocked_from_reuse',
    'unknown'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_usage_type as enum (
    'project_preview',
    'final_export',
    'preview',
    'export',
    'revision_preview',
    'library_audit',
    'manual_review'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.sfx_event_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  transition_plan_id uuid references public.transition_plans(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  stroke_motion_beat_id uuid references public.stroke_motion_beats(id) on delete set null,
  music_cue_id uuid,
  sound_effect_plan_id uuid references public.sound_effect_plans(id) on delete set null,
  target_layer public.sfx_target_layer not null default 'none',
  use_case public.sfx_use_case not null default 'custom',
  decision_state public.sfx_decision_state not null default 'optional',
  source_footage_policy public.sfx_source_footage_policy not null default 'edit_layer_only_default',
  reason text not null,
  scene_context text,
  video_tone text,
  edit_level public.edit_complexity,
  signature_system public.signature_system not null default 'none',
  anchor_type public.sfx_anchor_type not null default 'manual',
  anchor_time_seconds numeric,
  start_time_seconds numeric,
  hit_time_seconds numeric,
  end_time_seconds numeric,
  timing_priority public.sfx_timing_priority not null default 'frame_accurate',
  volume_profile public.sfx_volume_profile not null default 'subtle_polish',
  mix_priority public.sfx_mix_priority not null default 'voice_first',
  credit_impact text not null default 'low',
  requires_approval boolean not null default true,
  user_visible_summary text,
  avoid_rules jsonb not null default '[]'::jsonb,
  must_follow_rules jsonb not null default '[]'::jsonb,
  status public.sfx_generation_status not null default 'planned',
  notes text,
  event_payload jsonb not null default '{}'::jsonb,
  created_by_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_event_plans_anchor_time_nonnegative check (anchor_time_seconds is null or anchor_time_seconds >= 0),
  constraint sfx_event_plans_start_time_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint sfx_event_plans_hit_time_nonnegative check (hit_time_seconds is null or hit_time_seconds >= 0),
  constraint sfx_event_plans_end_time_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint sfx_event_plans_credit_impact_valid check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  constraint sfx_event_plans_avoid_rules_array check (jsonb_typeof(avoid_rules) = 'array'),
  constraint sfx_event_plans_must_follow_rules_array check (jsonb_typeof(must_follow_rules) = 'array'),
  constraint sfx_event_plans_payload_object check (jsonb_typeof(event_payload) = 'object')
);

comment on table public.sfx_event_plans is
'Plans edit-layer sound effects for ReeditPro. By default SFX supports transitions, titles, graphics, Stroke Motion, Real Motion, CTA reveals, montage hits, and ambient bridges, not every source-footage action.';
comment on column public.sfx_event_plans.source_footage_policy is
'Default is edit_layer_only_default. Source-footage-style SFX requires explicit user request, silent source, ambience repair, Real Motion support, or another documented professional reason.';
comment on column public.sfx_event_plans.target_layer is
'The ReeditPro edit layer the SFX supports. SFX should be tied to an edit layer and timing anchor.';
comment on column public.sfx_event_plans.volume_profile is
'Volume intent. SFX defaults to subtle/voice-first and must not overpower speech.';
comment on column public.sfx_event_plans.music_cue_id is
'Reserved link for future public.music_cues. No FK is added because the audio/music migration is not present in this repo yet.';

create table if not exists public.sfx_provider_routes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  recommended_provider public.sfx_provider not null default 'reeditpro_internal_library',
  provider_role public.sfx_provider_role not null default 'internal_library_first_choice',
  fallback_provider public.sfx_provider,
  reason text not null,
  use_internal_library_first boolean not null default true,
  use_mmaudio_for_draft boolean not null default false,
  use_mirelo_for_production boolean not null default false,
  no_sfx_allowed boolean not null default true,
  cost_sensitivity text not null default 'balanced',
  quality_target text not null default 'professional_subtle',
  approval_required boolean not null default true,
  route_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_provider_routes_payload_object check (jsonb_typeof(route_payload) = 'object')
);

comment on table public.sfx_provider_routes is
'Chooses between internal library, MMAudio V, Mirelo SFX V1.5, manual upload, unknown, or no SFX. This is routing metadata only and does not call providers.';

create table if not exists public.sfx_prompt_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  sfx_provider_route_id uuid references public.sfx_provider_routes(id) on delete set null,
  provider public.sfx_provider not null,
  model_name text,
  prompt_style public.sfx_prompt_style not null default 'short_phrase',
  prompt text,
  negative_prompt text,
  library_search_tags text[] not null default '{}'::text[],
  duration_needed_seconds numeric,
  duration_to_generate_seconds numeric,
  generated_duration_policy public.sfx_generated_duration_policy not null default 'generate_2_to_3_seconds',
  texture_words text[] not null default '{}'::text[],
  energy_words text[] not null default '{}'::text[],
  style_words text[] not null default '{}'::text[],
  avoid_words text[] not null default '{}'::text[],
  timing_instructions text,
  mix_instructions text,
  prompt_warnings jsonb not null default '[]'::jsonb,
  status public.sfx_generation_status not null default 'planned',
  prompt_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_prompt_plans_duration_needed_positive check (duration_needed_seconds is null or duration_needed_seconds > 0),
  constraint sfx_prompt_plans_duration_generate_positive check (duration_to_generate_seconds is null or duration_to_generate_seconds > 0),
  constraint sfx_prompt_plans_generate_covers_needed check (
    duration_to_generate_seconds is null
    or duration_needed_seconds is null
    or duration_to_generate_seconds >= duration_needed_seconds
  ),
  constraint sfx_prompt_plans_warnings_array check (jsonb_typeof(prompt_warnings) = 'array'),
  constraint sfx_prompt_plans_payload_object check (jsonb_typeof(prompt_payload) = 'object')
);

comment on table public.sfx_prompt_plans is
'Stores provider-specific SFX prompt plans without executing them. MMAudio prompts are usually short/video-conditioned; Mirelo prompts can be structured production prompts.';
comment on column public.sfx_prompt_plans.duration_to_generate_seconds is
'Generated SFX should usually be longer than the final needed sound so workers can trim to the best region and align the hit point.';

create table if not exists public.sfx_generated_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid references public.sfx_event_plans(id) on delete set null,
  sfx_prompt_plan_id uuid references public.sfx_prompt_plans(id) on delete set null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  provider public.sfx_provider not null default 'unknown',
  model_name text,
  origin public.audio_asset_origin not null default 'unknown',
  storage_path text,
  full_generated_duration_seconds numeric,
  recommended_trim_start_seconds numeric,
  recommended_trim_end_seconds numeric,
  detected_hit_time_seconds numeric,
  reuse_status public.sfx_reuse_status not null default 'project_generated',
  qa_status public.sfx_qa_status not null default 'pending',
  license_provenance_id uuid,
  license_scope public.audio_license_scope not null default 'unknown',
  status public.sfx_generation_status not null default 'generated',
  asset_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_generated_assets_duration_positive check (full_generated_duration_seconds is null or full_generated_duration_seconds > 0),
  constraint sfx_generated_assets_trim_start_nonnegative check (recommended_trim_start_seconds is null or recommended_trim_start_seconds >= 0),
  constraint sfx_generated_assets_trim_end_nonnegative check (recommended_trim_end_seconds is null or recommended_trim_end_seconds >= 0),
  constraint sfx_generated_assets_hit_time_nonnegative check (detected_hit_time_seconds is null or detected_hit_time_seconds >= 0),
  constraint sfx_generated_assets_payload_object check (jsonb_typeof(asset_payload) = 'object')
);

comment on table public.sfx_generated_assets is
'Generated SFX asset metadata. Generated SFX starts project-only; library reuse requires QA, privacy, licensing, and provenance review.';
comment on column public.sfx_generated_assets.storage_path is
'Canonical storage path metadata only. Do not store provider secrets, service-role keys, signed URLs, or credentials.';
comment on column public.sfx_generated_assets.license_provenance_id is
'Reserved link for future public.audio_license_provenance. No FK is added because RP-AUDIO tables are not present yet.';

create table if not exists public.sfx_trim_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  sfx_generated_asset_id uuid references public.sfx_generated_assets(id) on delete cascade,
  generated_duration_seconds numeric not null,
  needed_duration_seconds numeric not null,
  trim_start_seconds numeric not null,
  trim_end_seconds numeric not null,
  hit_offset_inside_trim_ms integer,
  fade_in_ms integer not null default 20,
  fade_out_ms integer not null default 80,
  tail_ms integer,
  reason text,
  requires_manual_review boolean not null default false,
  status public.sfx_generation_status not null default 'trimmed',
  trim_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_trim_plans_generated_duration_positive check (generated_duration_seconds > 0),
  constraint sfx_trim_plans_needed_duration_positive check (needed_duration_seconds > 0),
  constraint sfx_trim_plans_trim_start_nonnegative check (trim_start_seconds >= 0),
  constraint sfx_trim_plans_trim_end_after_start check (trim_end_seconds > trim_start_seconds),
  constraint sfx_trim_plans_hit_offset_nonnegative check (hit_offset_inside_trim_ms is null or hit_offset_inside_trim_ms >= 0),
  constraint sfx_trim_plans_fade_in_nonnegative check (fade_in_ms >= 0),
  constraint sfx_trim_plans_fade_out_nonnegative check (fade_out_ms >= 0),
  constraint sfx_trim_plans_tail_nonnegative check (tail_ms is null or tail_ms >= 0),
  constraint sfx_trim_plans_payload_object check (jsonb_typeof(trim_payload) = 'object')
);

comment on table public.sfx_trim_plans is
'Plans how generated SFX is trimmed to a final usable region. Generated SFX should be longer than needed, then trimmed and faded before placement.';

create table if not exists public.sfx_timing_alignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  sfx_trim_plan_id uuid references public.sfx_trim_plans(id) on delete set null,
  anchor_type public.sfx_anchor_type not null,
  anchor_time_seconds numeric not null,
  start_time_seconds numeric not null,
  hit_time_seconds numeric not null,
  end_time_seconds numeric not null,
  pre_roll_ms integer not null default 0,
  tail_ms integer not null default 0,
  duration_needed_ms integer,
  duration_generated_ms integer,
  hit_offset_inside_trim_ms integer,
  timing_priority public.sfx_timing_priority not null default 'frame_accurate',
  frame_accurate_required boolean not null default true,
  music_beat_aligned boolean not null default false,
  speech_safe_placement boolean not null default true,
  alignment_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_timing_alignments_anchor_nonnegative check (anchor_time_seconds >= 0),
  constraint sfx_timing_alignments_start_nonnegative check (start_time_seconds >= 0),
  constraint sfx_timing_alignments_hit_nonnegative check (hit_time_seconds >= 0),
  constraint sfx_timing_alignments_end_nonnegative check (end_time_seconds >= 0),
  constraint sfx_timing_alignments_end_after_start check (end_time_seconds >= start_time_seconds),
  constraint sfx_timing_alignments_pre_roll_nonnegative check (pre_roll_ms >= 0),
  constraint sfx_timing_alignments_tail_nonnegative check (tail_ms >= 0),
  constraint sfx_timing_alignments_needed_ms_positive check (duration_needed_ms is null or duration_needed_ms > 0),
  constraint sfx_timing_alignments_generated_ms_positive check (duration_generated_ms is null or duration_generated_ms > 0),
  constraint sfx_timing_alignments_hit_offset_nonnegative check (hit_offset_inside_trim_ms is null or hit_offset_inside_trim_ms >= 0),
  constraint sfx_timing_alignments_payload_object check (jsonb_typeof(alignment_payload) = 'object')
);

comment on table public.sfx_timing_alignments is
'Stores final SFX placement and hit alignment. The hit point should align to the timing anchor; file start is secondary.';
comment on column public.sfx_timing_alignments.hit_time_seconds is
'Timeline time where the detected or planned SFX hit lands. This is more important than file start for sync.';

create table if not exists public.sfx_mix_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  sfx_generated_asset_id uuid references public.sfx_generated_assets(id) on delete set null,
  volume_profile public.sfx_volume_profile not null default 'subtle_polish',
  target_gain_db numeric,
  duck_under_voice boolean not null default true,
  duck_under_music boolean not null default false,
  sidechain_to_voice boolean not null default true,
  sidechain_to_music boolean not null default false,
  fade_in_ms integer not null default 20,
  fade_out_ms integer not null default 80,
  eq_notes text,
  stereo_width text,
  reverb_match text,
  room_match text,
  mix_priority public.sfx_mix_priority not null default 'voice_first',
  voice_present boolean not null default true,
  music_present boolean not null default false,
  ambience_important boolean not null default true,
  status public.sfx_generation_status not null default 'mixed',
  mix_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_mix_plans_fade_in_nonnegative check (fade_in_ms >= 0),
  constraint sfx_mix_plans_fade_out_nonnegative check (fade_out_ms >= 0),
  constraint sfx_mix_plans_payload_object check (jsonb_typeof(mix_payload) = 'object')
);

comment on table public.sfx_mix_plans is
'Stores SFX volume, ducking, and mix decisions. Mixing is voice-first by default, and SFX must not be too loud under speech.';
comment on column public.sfx_mix_plans.duck_under_voice is
'True when SFX should reduce under voice to preserve dialogue clarity.';

create table if not exists public.sfx_qa_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  sfx_event_plan_id uuid not null references public.sfx_event_plans(id) on delete cascade,
  sfx_generated_asset_id uuid references public.sfx_generated_assets(id) on delete set null,
  sfx_trim_plan_id uuid references public.sfx_trim_plans(id) on delete set null,
  sfx_timing_alignment_id uuid references public.sfx_timing_alignments(id) on delete set null,
  sfx_mix_plan_id uuid references public.sfx_mix_plans(id) on delete set null,
  status public.sfx_qa_status not null default 'pending',
  overall_score numeric,
  timing_score numeric,
  volume_score numeric,
  style_fit_score numeric,
  voice_safety_score numeric,
  music_fit_score numeric,
  artifact_score numeric,
  recommended_action public.sfx_qa_recommended_action not null default 'use_with_mix_adjustment',
  approved_for_project boolean not null default false,
  approved_for_library_candidate boolean not null default false,
  requires_regeneration boolean not null default false,
  requires_trim_adjustment boolean not null default false,
  requires_mix_adjustment boolean not null default false,
  qa_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_qa_reports_overall_score_range check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  constraint sfx_qa_reports_timing_score_range check (timing_score is null or (timing_score >= 0 and timing_score <= 100)),
  constraint sfx_qa_reports_volume_score_range check (volume_score is null or (volume_score >= 0 and volume_score <= 100)),
  constraint sfx_qa_reports_style_fit_score_range check (style_fit_score is null or (style_fit_score >= 0 and style_fit_score <= 100)),
  constraint sfx_qa_reports_voice_safety_score_range check (voice_safety_score is null or (voice_safety_score >= 0 and voice_safety_score <= 100)),
  constraint sfx_qa_reports_music_fit_score_range check (music_fit_score is null or (music_fit_score >= 0 and music_fit_score <= 100)),
  constraint sfx_qa_reports_artifact_score_range check (artifact_score is null or (artifact_score >= 0 and artifact_score <= 100)),
  constraint sfx_qa_reports_payload_object check (jsonb_typeof(qa_payload) = 'object')
);

comment on table public.sfx_qa_reports is
'Stores SFX QA reports. QA decides whether to use, adjust, regenerate, replace, remove, or ask the user before preview/export.';

create table if not exists public.sfx_qa_issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  sfx_qa_report_id uuid not null references public.sfx_qa_reports(id) on delete cascade,
  sfx_event_plan_id uuid references public.sfx_event_plans(id) on delete cascade,
  issue_type public.sfx_qa_issue_type not null,
  severity text not null default 'medium',
  description text not null,
  recommended_fix text,
  start_time_seconds numeric,
  end_time_seconds numeric,
  blocks_use boolean not null default false,
  issue_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sfx_qa_issues_severity_valid check (severity in ('info', 'warning', 'low', 'medium', 'high', 'critical', 'blocking')),
  constraint sfx_qa_issues_start_time_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint sfx_qa_issues_end_time_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint sfx_qa_issues_payload_object check (jsonb_typeof(issue_payload) = 'object')
);

comment on table public.sfx_qa_issues is
'Individual timing, volume, style, artifact, voice-safety, music-fit, provenance, or not-needed issues found during SFX QA.';

create table if not exists public.sfx_library_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  sfx_generated_asset_id uuid not null references public.sfx_generated_assets(id) on delete cascade,
  sfx_event_plan_id uuid references public.sfx_event_plans(id) on delete set null,
  reuse_status public.sfx_reuse_status not null default 'candidate_for_library',
  candidate_reason text,
  quality_score numeric,
  target_layer public.sfx_target_layer not null default 'none',
  use_case public.sfx_use_case not null default 'custom',
  provider public.sfx_provider not null default 'unknown',
  model_name text,
  general_purpose boolean not null default false,
  contains_private_context boolean not null default true,
  license_review_required boolean not null default true,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  tags text[] not null default '{}'::text[],
  recommended_use_cases public.sfx_use_case[] not null default '{}'::public.sfx_use_case[],
  avoid_use_cases public.sfx_use_case[] not null default '{}'::public.sfx_use_case[],
  metadata jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_library_candidates_quality_score_range check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  constraint sfx_library_candidates_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.sfx_library_candidates is
'Generated SFX candidates for future internal library reuse. Promotion requires QA, non-private context, and provenance/licensing review.';
comment on column public.sfx_library_candidates.contains_private_context is
'True when the sound is tied to private/client/project context and should not become a shared internal library asset.';
comment on column public.sfx_library_candidates.license_review_required is
'True until provider terms, reuse permission, commercial rights, ads rights, and provenance are reviewed.';

create table if not exists public.sfx_usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  export_id uuid references public.exports(id) on delete set null,
  sfx_generated_asset_id uuid references public.sfx_generated_assets(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  sfx_event_plan_id uuid references public.sfx_event_plans(id) on delete set null,
  sfx_timing_alignment_id uuid references public.sfx_timing_alignments(id) on delete set null,
  sfx_mix_plan_id uuid references public.sfx_mix_plans(id) on delete set null,
  usage_type public.audio_usage_type not null default 'project_preview',
  used_start_time_seconds numeric,
  used_end_time_seconds numeric,
  hit_time_seconds numeric,
  volume_profile public.sfx_volume_profile not null default 'subtle_polish',
  user_kept boolean,
  user_removed boolean,
  qa_passed boolean,
  usage_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  constraint sfx_usage_records_start_nonnegative check (used_start_time_seconds is null or used_start_time_seconds >= 0),
  constraint sfx_usage_records_end_nonnegative check (used_end_time_seconds is null or used_end_time_seconds >= 0),
  constraint sfx_usage_records_hit_nonnegative check (hit_time_seconds is null or hit_time_seconds >= 0),
  constraint sfx_usage_records_payload_object check (jsonb_typeof(usage_payload) = 'object')
);

comment on table public.sfx_usage_records is
'Tracks where a planned or generated SFX was used in previews, exports, revisions, library review, or manual review.';

create table if not exists public.sfx_prompt_adapter_tests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider public.sfx_provider not null,
  model_name text,
  prompt_style public.sfx_prompt_style not null,
  test_prompt text not null,
  expected_use_case public.sfx_use_case not null default 'custom',
  result_quality_score numeric,
  timing_fit_score numeric,
  style_fit_score numeric,
  status text not null default 'planned',
  notes text,
  test_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_prompt_adapter_tests_quality_score_range check (result_quality_score is null or (result_quality_score >= 0 and result_quality_score <= 100)),
  constraint sfx_prompt_adapter_tests_timing_score_range check (timing_fit_score is null or (timing_fit_score >= 0 and timing_fit_score <= 100)),
  constraint sfx_prompt_adapter_tests_style_score_range check (style_fit_score is null or (style_fit_score >= 0 and style_fit_score <= 100)),
  constraint sfx_prompt_adapter_tests_status_valid check (
    status in (
      'planned',
      'ready_for_test',
      'tested',
      'passed',
      'failed',
      'archived',
      'approved_pattern',
      'rejected_pattern',
      'needs_more_examples'
    )
  ),
  constraint sfx_prompt_adapter_tests_payload_object check (jsonb_typeof(test_payload) = 'object')
);

comment on table public.sfx_prompt_adapter_tests is
'Future Mirelo/MMAudio/internal-library prompt-style tests. This table stores test planning and results only; it does not call providers.';

create or replace view public.sfx_event_summary_view
with (security_invoker = true) as
select
  e.id as sfx_event_plan_id,
  e.workspace_id,
  e.project_id,
  e.edit_plan_id,
  e.edit_plan_segment_id,
  e.target_layer,
  e.use_case,
  e.decision_state,
  e.source_footage_policy,
  e.anchor_type,
  e.anchor_time_seconds,
  e.volume_profile,
  e.status as event_status,
  r.recommended_provider,
  r.provider_role,
  p.prompt_style,
  p.model_name as prompt_model_name,
  a.id as sfx_generated_asset_id,
  a.reuse_status,
  a.qa_status as asset_qa_status,
  q.status as qa_report_status,
  q.recommended_action,
  q.approved_for_project,
  q.approved_for_library_candidate
from public.sfx_event_plans e
left join public.sfx_provider_routes r on r.sfx_event_plan_id = e.id
left join public.sfx_prompt_plans p on p.sfx_event_plan_id = e.id
left join public.sfx_generated_assets a on a.sfx_event_plan_id = e.id
left join public.sfx_qa_reports q on q.sfx_event_plan_id = e.id;

comment on view public.sfx_event_summary_view is
'Simple read view for SoundSync SFX Director planning, routing, prompt, generated asset, and QA state. It does not execute provider calls.';

create index if not exists idx_sfx_event_plans_workspace on public.sfx_event_plans(workspace_id);
create index if not exists idx_sfx_event_plans_project on public.sfx_event_plans(project_id);
create index if not exists idx_sfx_event_plans_chat_session on public.sfx_event_plans(chat_session_id);
create index if not exists idx_sfx_event_plans_edit_plan on public.sfx_event_plans(edit_plan_id);
create index if not exists idx_sfx_event_plans_segment on public.sfx_event_plans(edit_plan_segment_id);
create index if not exists idx_sfx_event_plans_transition on public.sfx_event_plans(transition_plan_id);
create index if not exists idx_sfx_event_plans_signature_route on public.sfx_event_plans(signature_route_id);
create index if not exists idx_sfx_event_plans_stroke_beat on public.sfx_event_plans(stroke_motion_beat_id);
create index if not exists idx_sfx_event_plans_music_cue on public.sfx_event_plans(music_cue_id);
create index if not exists idx_sfx_event_plans_sound_effect_plan on public.sfx_event_plans(sound_effect_plan_id);
create index if not exists idx_sfx_event_plans_target_layer on public.sfx_event_plans(target_layer);
create index if not exists idx_sfx_event_plans_use_case on public.sfx_event_plans(use_case);
create index if not exists idx_sfx_event_plans_decision_state on public.sfx_event_plans(decision_state);
create index if not exists idx_sfx_event_plans_source_policy on public.sfx_event_plans(source_footage_policy);
create index if not exists idx_sfx_event_plans_anchor_type on public.sfx_event_plans(anchor_type);
create index if not exists idx_sfx_event_plans_status on public.sfx_event_plans(status);
create index if not exists idx_sfx_event_plans_signature_system on public.sfx_event_plans(signature_system);

create index if not exists idx_sfx_provider_routes_workspace on public.sfx_provider_routes(workspace_id);
create index if not exists idx_sfx_provider_routes_project on public.sfx_provider_routes(project_id);
create index if not exists idx_sfx_provider_routes_edit_plan on public.sfx_provider_routes(edit_plan_id);
create index if not exists idx_sfx_provider_routes_event on public.sfx_provider_routes(sfx_event_plan_id);
create index if not exists idx_sfx_provider_routes_recommended_provider on public.sfx_provider_routes(recommended_provider);
create index if not exists idx_sfx_provider_routes_role on public.sfx_provider_routes(provider_role);
create index if not exists idx_sfx_provider_routes_fallback on public.sfx_provider_routes(fallback_provider);
create index if not exists idx_sfx_provider_routes_library_first on public.sfx_provider_routes(use_internal_library_first);
create index if not exists idx_sfx_provider_routes_mmaudio on public.sfx_provider_routes(use_mmaudio_for_draft);
create index if not exists idx_sfx_provider_routes_mirelo on public.sfx_provider_routes(use_mirelo_for_production);

create index if not exists idx_sfx_prompt_plans_workspace on public.sfx_prompt_plans(workspace_id);
create index if not exists idx_sfx_prompt_plans_project on public.sfx_prompt_plans(project_id);
create index if not exists idx_sfx_prompt_plans_edit_plan on public.sfx_prompt_plans(edit_plan_id);
create index if not exists idx_sfx_prompt_plans_event on public.sfx_prompt_plans(sfx_event_plan_id);
create index if not exists idx_sfx_prompt_plans_route on public.sfx_prompt_plans(sfx_provider_route_id);
create index if not exists idx_sfx_prompt_plans_provider on public.sfx_prompt_plans(provider);
create index if not exists idx_sfx_prompt_plans_model on public.sfx_prompt_plans(model_name);
create index if not exists idx_sfx_prompt_plans_style on public.sfx_prompt_plans(prompt_style);
create index if not exists idx_sfx_prompt_plans_status on public.sfx_prompt_plans(status);

create index if not exists idx_sfx_generated_assets_workspace on public.sfx_generated_assets(workspace_id);
create index if not exists idx_sfx_generated_assets_project on public.sfx_generated_assets(project_id);
create index if not exists idx_sfx_generated_assets_edit_plan on public.sfx_generated_assets(edit_plan_id);
create index if not exists idx_sfx_generated_assets_event on public.sfx_generated_assets(sfx_event_plan_id);
create index if not exists idx_sfx_generated_assets_prompt on public.sfx_generated_assets(sfx_prompt_plan_id);
create index if not exists idx_sfx_generated_assets_generation_request on public.sfx_generated_assets(generation_request_id);
create index if not exists idx_sfx_generated_assets_generated_asset on public.sfx_generated_assets(generated_asset_id);
create index if not exists idx_sfx_generated_assets_media_asset on public.sfx_generated_assets(media_asset_id);
create index if not exists idx_sfx_generated_assets_provider on public.sfx_generated_assets(provider);
create index if not exists idx_sfx_generated_assets_model on public.sfx_generated_assets(model_name);
create index if not exists idx_sfx_generated_assets_origin on public.sfx_generated_assets(origin);
create index if not exists idx_sfx_generated_assets_storage_path on public.sfx_generated_assets(storage_path);
create index if not exists idx_sfx_generated_assets_reuse_status on public.sfx_generated_assets(reuse_status);
create index if not exists idx_sfx_generated_assets_qa_status on public.sfx_generated_assets(qa_status);
create index if not exists idx_sfx_generated_assets_license_provenance on public.sfx_generated_assets(license_provenance_id);
create index if not exists idx_sfx_generated_assets_status on public.sfx_generated_assets(status);

create index if not exists idx_sfx_trim_plans_workspace on public.sfx_trim_plans(workspace_id);
create index if not exists idx_sfx_trim_plans_project on public.sfx_trim_plans(project_id);
create index if not exists idx_sfx_trim_plans_edit_plan on public.sfx_trim_plans(edit_plan_id);
create index if not exists idx_sfx_trim_plans_event on public.sfx_trim_plans(sfx_event_plan_id);
create index if not exists idx_sfx_trim_plans_generated_asset on public.sfx_trim_plans(sfx_generated_asset_id);
create index if not exists idx_sfx_trim_plans_status on public.sfx_trim_plans(status);
create index if not exists idx_sfx_trim_plans_manual_review on public.sfx_trim_plans(requires_manual_review);

create index if not exists idx_sfx_timing_alignments_workspace on public.sfx_timing_alignments(workspace_id);
create index if not exists idx_sfx_timing_alignments_project on public.sfx_timing_alignments(project_id);
create index if not exists idx_sfx_timing_alignments_edit_plan on public.sfx_timing_alignments(edit_plan_id);
create index if not exists idx_sfx_timing_alignments_event on public.sfx_timing_alignments(sfx_event_plan_id);
create index if not exists idx_sfx_timing_alignments_trim on public.sfx_timing_alignments(sfx_trim_plan_id);
create index if not exists idx_sfx_timing_alignments_anchor_type on public.sfx_timing_alignments(anchor_type);
create index if not exists idx_sfx_timing_alignments_anchor_time on public.sfx_timing_alignments(anchor_time_seconds);
create index if not exists idx_sfx_timing_alignments_priority on public.sfx_timing_alignments(timing_priority);
create index if not exists idx_sfx_timing_alignments_frame_required on public.sfx_timing_alignments(frame_accurate_required);
create index if not exists idx_sfx_timing_alignments_music_beat on public.sfx_timing_alignments(music_beat_aligned);
create index if not exists idx_sfx_timing_alignments_speech_safe on public.sfx_timing_alignments(speech_safe_placement);

create index if not exists idx_sfx_mix_plans_workspace on public.sfx_mix_plans(workspace_id);
create index if not exists idx_sfx_mix_plans_project on public.sfx_mix_plans(project_id);
create index if not exists idx_sfx_mix_plans_edit_plan on public.sfx_mix_plans(edit_plan_id);
create index if not exists idx_sfx_mix_plans_event on public.sfx_mix_plans(sfx_event_plan_id);
create index if not exists idx_sfx_mix_plans_generated_asset on public.sfx_mix_plans(sfx_generated_asset_id);
create index if not exists idx_sfx_mix_plans_volume_profile on public.sfx_mix_plans(volume_profile);
create index if not exists idx_sfx_mix_plans_mix_priority on public.sfx_mix_plans(mix_priority);
create index if not exists idx_sfx_mix_plans_duck_voice on public.sfx_mix_plans(duck_under_voice);
create index if not exists idx_sfx_mix_plans_duck_music on public.sfx_mix_plans(duck_under_music);
create index if not exists idx_sfx_mix_plans_voice_present on public.sfx_mix_plans(voice_present);
create index if not exists idx_sfx_mix_plans_music_present on public.sfx_mix_plans(music_present);
create index if not exists idx_sfx_mix_plans_ambience on public.sfx_mix_plans(ambience_important);
create index if not exists idx_sfx_mix_plans_status on public.sfx_mix_plans(status);

create index if not exists idx_sfx_qa_reports_workspace on public.sfx_qa_reports(workspace_id);
create index if not exists idx_sfx_qa_reports_project on public.sfx_qa_reports(project_id);
create index if not exists idx_sfx_qa_reports_edit_plan on public.sfx_qa_reports(edit_plan_id);
create index if not exists idx_sfx_qa_reports_event on public.sfx_qa_reports(sfx_event_plan_id);
create index if not exists idx_sfx_qa_reports_generated_asset on public.sfx_qa_reports(sfx_generated_asset_id);
create index if not exists idx_sfx_qa_reports_trim on public.sfx_qa_reports(sfx_trim_plan_id);
create index if not exists idx_sfx_qa_reports_alignment on public.sfx_qa_reports(sfx_timing_alignment_id);
create index if not exists idx_sfx_qa_reports_mix on public.sfx_qa_reports(sfx_mix_plan_id);
create index if not exists idx_sfx_qa_reports_status on public.sfx_qa_reports(status);
create index if not exists idx_sfx_qa_reports_action on public.sfx_qa_reports(recommended_action);
create index if not exists idx_sfx_qa_reports_approved_project on public.sfx_qa_reports(approved_for_project);
create index if not exists idx_sfx_qa_reports_library_candidate on public.sfx_qa_reports(approved_for_library_candidate);
create index if not exists idx_sfx_qa_reports_regeneration on public.sfx_qa_reports(requires_regeneration);
create index if not exists idx_sfx_qa_reports_trim_adjustment on public.sfx_qa_reports(requires_trim_adjustment);
create index if not exists idx_sfx_qa_reports_mix_adjustment on public.sfx_qa_reports(requires_mix_adjustment);

create index if not exists idx_sfx_qa_issues_workspace on public.sfx_qa_issues(workspace_id);
create index if not exists idx_sfx_qa_issues_project on public.sfx_qa_issues(project_id);
create index if not exists idx_sfx_qa_issues_report on public.sfx_qa_issues(sfx_qa_report_id);
create index if not exists idx_sfx_qa_issues_event on public.sfx_qa_issues(sfx_event_plan_id);
create index if not exists idx_sfx_qa_issues_type on public.sfx_qa_issues(issue_type);
create index if not exists idx_sfx_qa_issues_severity on public.sfx_qa_issues(severity);
create index if not exists idx_sfx_qa_issues_blocks_use on public.sfx_qa_issues(blocks_use);

create index if not exists idx_sfx_library_candidates_workspace on public.sfx_library_candidates(workspace_id);
create index if not exists idx_sfx_library_candidates_project on public.sfx_library_candidates(project_id);
create index if not exists idx_sfx_library_candidates_generated_asset on public.sfx_library_candidates(sfx_generated_asset_id);
create index if not exists idx_sfx_library_candidates_event on public.sfx_library_candidates(sfx_event_plan_id);
create index if not exists idx_sfx_library_candidates_reuse_status on public.sfx_library_candidates(reuse_status);
create index if not exists idx_sfx_library_candidates_target_layer on public.sfx_library_candidates(target_layer);
create index if not exists idx_sfx_library_candidates_use_case on public.sfx_library_candidates(use_case);
create index if not exists idx_sfx_library_candidates_provider on public.sfx_library_candidates(provider);
create index if not exists idx_sfx_library_candidates_general on public.sfx_library_candidates(general_purpose);
create index if not exists idx_sfx_library_candidates_private on public.sfx_library_candidates(contains_private_context);
create index if not exists idx_sfx_library_candidates_license_review on public.sfx_library_candidates(license_review_required);
create index if not exists idx_sfx_library_candidates_approved_by on public.sfx_library_candidates(approved_by);
create index if not exists idx_sfx_library_candidates_approved_at on public.sfx_library_candidates(approved_at);

create index if not exists idx_sfx_usage_records_workspace on public.sfx_usage_records(workspace_id);
create index if not exists idx_sfx_usage_records_project on public.sfx_usage_records(project_id);
create index if not exists idx_sfx_usage_records_edit_plan on public.sfx_usage_records(edit_plan_id);
create index if not exists idx_sfx_usage_records_render on public.sfx_usage_records(render_id);
create index if not exists idx_sfx_usage_records_export on public.sfx_usage_records(export_id);
create index if not exists idx_sfx_usage_records_sfx_asset on public.sfx_usage_records(sfx_generated_asset_id);
create index if not exists idx_sfx_usage_records_generated_asset on public.sfx_usage_records(generated_asset_id);
create index if not exists idx_sfx_usage_records_event on public.sfx_usage_records(sfx_event_plan_id);
create index if not exists idx_sfx_usage_records_alignment on public.sfx_usage_records(sfx_timing_alignment_id);
create index if not exists idx_sfx_usage_records_mix on public.sfx_usage_records(sfx_mix_plan_id);
create index if not exists idx_sfx_usage_records_usage_type on public.sfx_usage_records(usage_type);
create index if not exists idx_sfx_usage_records_volume_profile on public.sfx_usage_records(volume_profile);
create index if not exists idx_sfx_usage_records_qa_passed on public.sfx_usage_records(qa_passed);

create index if not exists idx_sfx_prompt_adapter_tests_workspace on public.sfx_prompt_adapter_tests(workspace_id);
create index if not exists idx_sfx_prompt_adapter_tests_provider on public.sfx_prompt_adapter_tests(provider);
create index if not exists idx_sfx_prompt_adapter_tests_model on public.sfx_prompt_adapter_tests(model_name);
create index if not exists idx_sfx_prompt_adapter_tests_style on public.sfx_prompt_adapter_tests(prompt_style);
create index if not exists idx_sfx_prompt_adapter_tests_use_case on public.sfx_prompt_adapter_tests(expected_use_case);
create index if not exists idx_sfx_prompt_adapter_tests_status on public.sfx_prompt_adapter_tests(status);
create unique index if not exists idx_sfx_prompt_adapter_tests_seed_uidx
on public.sfx_prompt_adapter_tests(provider, coalesce(model_name, ''), prompt_style, test_prompt);

drop trigger if exists sfx_event_plans_set_updated_at on public.sfx_event_plans;
create trigger sfx_event_plans_set_updated_at
before update on public.sfx_event_plans
for each row execute function public.set_updated_at();

drop trigger if exists sfx_provider_routes_set_updated_at on public.sfx_provider_routes;
create trigger sfx_provider_routes_set_updated_at
before update on public.sfx_provider_routes
for each row execute function public.set_updated_at();

drop trigger if exists sfx_prompt_plans_set_updated_at on public.sfx_prompt_plans;
create trigger sfx_prompt_plans_set_updated_at
before update on public.sfx_prompt_plans
for each row execute function public.set_updated_at();

drop trigger if exists sfx_generated_assets_set_updated_at on public.sfx_generated_assets;
create trigger sfx_generated_assets_set_updated_at
before update on public.sfx_generated_assets
for each row execute function public.set_updated_at();

drop trigger if exists sfx_trim_plans_set_updated_at on public.sfx_trim_plans;
create trigger sfx_trim_plans_set_updated_at
before update on public.sfx_trim_plans
for each row execute function public.set_updated_at();

drop trigger if exists sfx_timing_alignments_set_updated_at on public.sfx_timing_alignments;
create trigger sfx_timing_alignments_set_updated_at
before update on public.sfx_timing_alignments
for each row execute function public.set_updated_at();

drop trigger if exists sfx_mix_plans_set_updated_at on public.sfx_mix_plans;
create trigger sfx_mix_plans_set_updated_at
before update on public.sfx_mix_plans
for each row execute function public.set_updated_at();

drop trigger if exists sfx_qa_reports_set_updated_at on public.sfx_qa_reports;
create trigger sfx_qa_reports_set_updated_at
before update on public.sfx_qa_reports
for each row execute function public.set_updated_at();

drop trigger if exists sfx_library_candidates_set_updated_at on public.sfx_library_candidates;
create trigger sfx_library_candidates_set_updated_at
before update on public.sfx_library_candidates
for each row execute function public.set_updated_at();

drop trigger if exists sfx_prompt_adapter_tests_set_updated_at on public.sfx_prompt_adapter_tests;
create trigger sfx_prompt_adapter_tests_set_updated_at
before update on public.sfx_prompt_adapter_tests
for each row execute function public.set_updated_at();

alter table public.sfx_event_plans enable row level security;
alter table public.sfx_provider_routes enable row level security;
alter table public.sfx_prompt_plans enable row level security;
alter table public.sfx_generated_assets enable row level security;
alter table public.sfx_trim_plans enable row level security;
alter table public.sfx_timing_alignments enable row level security;
alter table public.sfx_mix_plans enable row level security;
alter table public.sfx_qa_reports enable row level security;
alter table public.sfx_qa_issues enable row level security;
alter table public.sfx_library_candidates enable row level security;
alter table public.sfx_usage_records enable row level security;
alter table public.sfx_prompt_adapter_tests enable row level security;

create policy sfx_event_plans_select_member on public.sfx_event_plans
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_event_plans_insert_editor on public.sfx_event_plans
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_event_plans_update_editor on public.sfx_event_plans
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_provider_routes_select_member on public.sfx_provider_routes
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_provider_routes_insert_editor on public.sfx_provider_routes
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_provider_routes_update_editor on public.sfx_provider_routes
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_prompt_plans_select_member on public.sfx_prompt_plans
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_prompt_plans_insert_editor on public.sfx_prompt_plans
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_prompt_plans_update_editor on public.sfx_prompt_plans
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_generated_assets_select_member on public.sfx_generated_assets
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_generated_assets_insert_editor on public.sfx_generated_assets
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_generated_assets_update_editor on public.sfx_generated_assets
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_trim_plans_select_member on public.sfx_trim_plans
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_trim_plans_insert_editor on public.sfx_trim_plans
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_trim_plans_update_editor on public.sfx_trim_plans
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_timing_alignments_select_member on public.sfx_timing_alignments
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_timing_alignments_insert_editor on public.sfx_timing_alignments
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_timing_alignments_update_editor on public.sfx_timing_alignments
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_mix_plans_select_member on public.sfx_mix_plans
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_mix_plans_insert_editor on public.sfx_mix_plans
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_mix_plans_update_editor on public.sfx_mix_plans
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_qa_reports_select_member on public.sfx_qa_reports
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_qa_reports_insert_editor on public.sfx_qa_reports
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_qa_reports_update_editor on public.sfx_qa_reports
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_qa_issues_select_member on public.sfx_qa_issues
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_qa_issues_insert_editor on public.sfx_qa_issues
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_qa_issues_update_editor on public.sfx_qa_issues
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_library_candidates_select_member on public.sfx_library_candidates
for select to authenticated
using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy sfx_library_candidates_insert_editor on public.sfx_library_candidates
for insert to authenticated
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_library_candidates_update_editor on public.sfx_library_candidates
for update to authenticated
using (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_usage_records_select_member on public.sfx_usage_records
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy sfx_usage_records_insert_editor on public.sfx_usage_records
for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
create policy sfx_usage_records_update_editor on public.sfx_usage_records
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_prompt_adapter_tests_select_authenticated on public.sfx_prompt_adapter_tests
for select to authenticated
using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy sfx_prompt_adapter_tests_insert_admin on public.sfx_prompt_adapter_tests
for insert to authenticated
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));
create policy sfx_prompt_adapter_tests_update_admin on public.sfx_prompt_adapter_tests
for update to authenticated
using (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id))
with check (workspace_id is not null and public.is_workspace_owner_or_admin(workspace_id));

revoke all on table public.sfx_event_plans from public, anon;
revoke all on table public.sfx_provider_routes from public, anon;
revoke all on table public.sfx_prompt_plans from public, anon;
revoke all on table public.sfx_generated_assets from public, anon;
revoke all on table public.sfx_trim_plans from public, anon;
revoke all on table public.sfx_timing_alignments from public, anon;
revoke all on table public.sfx_mix_plans from public, anon;
revoke all on table public.sfx_qa_reports from public, anon;
revoke all on table public.sfx_qa_issues from public, anon;
revoke all on table public.sfx_library_candidates from public, anon;
revoke all on table public.sfx_usage_records from public, anon;
revoke all on table public.sfx_prompt_adapter_tests from public, anon;

grant select, insert, update on table public.sfx_event_plans to authenticated;
grant select, insert, update on table public.sfx_provider_routes to authenticated;
grant select, insert, update on table public.sfx_prompt_plans to authenticated;
grant select, insert, update on table public.sfx_generated_assets to authenticated;
grant select, insert, update on table public.sfx_trim_plans to authenticated;
grant select, insert, update on table public.sfx_timing_alignments to authenticated;
grant select, insert, update on table public.sfx_mix_plans to authenticated;
grant select, insert, update on table public.sfx_qa_reports to authenticated;
grant select, insert, update on table public.sfx_qa_issues to authenticated;
grant select, insert, update on table public.sfx_library_candidates to authenticated;
grant select, insert, update on table public.sfx_usage_records to authenticated;
grant select, insert, update on table public.sfx_prompt_adapter_tests to authenticated;
grant select on table public.sfx_event_summary_view to authenticated;

grant all on table public.sfx_event_plans to service_role;
grant all on table public.sfx_provider_routes to service_role;
grant all on table public.sfx_prompt_plans to service_role;
grant all on table public.sfx_generated_assets to service_role;
grant all on table public.sfx_trim_plans to service_role;
grant all on table public.sfx_timing_alignments to service_role;
grant all on table public.sfx_mix_plans to service_role;
grant all on table public.sfx_qa_reports to service_role;
grant all on table public.sfx_qa_issues to service_role;
grant all on table public.sfx_library_candidates to service_role;
grant all on table public.sfx_usage_records to service_role;
grant all on table public.sfx_prompt_adapter_tests to service_role;
grant select on table public.sfx_event_summary_view to service_role;

grant usage on type public.sfx_decision_state to authenticated, service_role;
grant usage on type public.sfx_target_layer to authenticated, service_role;
grant usage on type public.sfx_provider to authenticated, service_role;
grant usage on type public.sfx_provider_role to authenticated, service_role;
grant usage on type public.sfx_prompt_style to authenticated, service_role;
grant usage on type public.sfx_anchor_type to authenticated, service_role;
grant usage on type public.sfx_timing_priority to authenticated, service_role;
grant usage on type public.sfx_volume_profile to authenticated, service_role;
grant usage on type public.sfx_mix_priority to authenticated, service_role;
grant usage on type public.sfx_generation_status to authenticated, service_role;
grant usage on type public.sfx_reuse_status to authenticated, service_role;
grant usage on type public.sfx_qa_status to authenticated, service_role;
grant usage on type public.sfx_qa_issue_type to authenticated, service_role;
grant usage on type public.sfx_qa_recommended_action to authenticated, service_role;
grant usage on type public.sfx_source_footage_policy to authenticated, service_role;
grant usage on type public.sfx_generated_duration_policy to authenticated, service_role;
grant usage on type public.sfx_use_case to authenticated, service_role;
grant usage on type public.audio_asset_origin to authenticated, service_role;
grant usage on type public.audio_license_scope to authenticated, service_role;
grant usage on type public.audio_usage_type to authenticated, service_role;

insert into public.sfx_prompt_adapter_tests (
  provider,
  model_name,
  prompt_style,
  test_prompt,
  expected_use_case,
  status,
  notes,
  test_payload
) values
  (
    'mirelo_sfx_v1_5',
    'mirelo-sfx-v1.5',
    'structured_sentence',
    'Soft premium transition whoosh, clean airy movement, subtle luxury tone, short smooth tail, no harsh riser, no cartoon, no sci-fi.',
    'transition_soft_whoosh',
    'planned',
    'Safe future prompt-style test only. No provider call is made.',
    '{"test_family":"mirelo_structured_prompt"}'::jsonb
  ),
  (
    'mirelo_sfx_v1_5',
    'mirelo-sfx-v1.5',
    'structured_sentence',
    'Gentle stroke drawing sound, soft pencil-like line trace, light texture, no loud scratch, no cartoon effect, short clean tail.',
    'stroke_line_trace',
    'planned',
    'Safe future prompt-style test only. No provider call is made.',
    '{"test_family":"mirelo_stroke_prompt"}'::jsonb
  ),
  (
    'mmaudio_v',
    'mmaudio-v',
    'video_conditioned_short_prompt',
    'soft transition whoosh',
    'transition_soft_whoosh',
    'planned',
    'Safe future MMAudio short-prompt test only. No provider call is made.',
    '{"test_family":"mmaudio_short_prompt"}'::jsonb
  ),
  (
    'mmaudio_v',
    'mmaudio-v',
    'video_conditioned_short_prompt',
    'gentle line drawing sound',
    'stroke_line_trace',
    'planned',
    'Safe future MMAudio short-prompt test only. No provider call is made.',
    '{"test_family":"mmaudio_line_prompt"}'::jsonb
  ),
  (
    'reeditpro_internal_library',
    'reeditpro-internal-library',
    'library_search_tags',
    'graphic_design, card_reveal, subtle_click, professional',
    'graphic_card_reveal',
    'planned',
    'Safe future internal library tag-search test only.',
    '{"test_family":"internal_library_tags"}'::jsonb
  )
on conflict do nothing;
