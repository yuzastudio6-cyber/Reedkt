-- RP-AUDIO-03: SoundSync Music Intelligence Tables
-- Local-only migration for the Supabase project named `reeditpro`.
-- This migration stores music intelligence planning, cue sheets, Lyria Pro prompt
-- plans, generated music records, QA, mix/ducking plans, provenance, usage, and
-- SFX library records. It does not call Lyria Pro, store provider credentials,
-- connect to Supabase remotely, deploy Google Cloud workers, render audio/video,
-- integrate Stripe, or run generation.

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

alter type public.generation_provider_type add value if not exists 'lyria_pro';

do $$
begin
  create type public.music_scene_type as enum (
    'talking_head',
    'dialogue',
    'narration',
    'lifestyle',
    'vacation',
    'travel_montage',
    'coming_up_teaser',
    'intro',
    'outro',
    'chapter_transition',
    'food_social',
    'boat_movement',
    'city_walk',
    'luxury_showcase',
    'real_estate',
    'product_demo',
    'education',
    'faith_reflective',
    'fitness',
    'comedy',
    'documentary',
    'ad_sales',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_cue_role as enum (
    'no_music',
    'subtle_bed',
    'dialogue_bed',
    'intro_hook',
    'coming_up_teaser',
    'montage_driver',
    'travel_movement',
    'chapter_transition',
    'emotional_support',
    'premium_polish',
    'comedic_accent',
    'food_social_warmth',
    'sales_momentum',
    'outro_resolve',
    'ambient_only',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vocal_policy as enum (
    'no_vocals',
    'instrumental_only',
    'vocal_texture_only',
    'vocal_chops_only',
    'soft_hook_vocals',
    'full_lyrical_song',
    'lyrics_allowed_only_without_speech',
    'intro_outro_vocals_only',
    'user_requested_vocals'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.lyric_language_policy as enum (
    'no_lyrics',
    'same_as_spoken_language',
    'match_location_context',
    'english_only',
    'french_allowed',
    'italian_allowed',
    'spanish_allowed',
    'japanese_allowed',
    'korean_allowed',
    'portuguese_allowed',
    'multilingual_allowed',
    'user_specified',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_culture_region as enum (
    'global',
    'usa',
    'uk',
    'france',
    'italy',
    'spain',
    'latin_america',
    'caribbean',
    'west_africa',
    'east_africa',
    'middle_east',
    'india',
    'japan',
    'korea',
    'southeast_asia',
    'european_luxury',
    'tropical',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_genre_family as enum (
    'cinematic',
    'orchestral',
    'ambient',
    'pop',
    'indie_pop',
    'french_pop',
    'italian_inspired_pop',
    'hip_hop',
    'trap',
    'lofi_hip_hop',
    'rnb',
    'soul',
    'gospel_inspired',
    'rock',
    'acoustic',
    'folk',
    'jazz',
    'electronic',
    'house',
    'tropical_house',
    'afrobeat',
    'latin',
    'reggaeton',
    'dancehall',
    'reggae',
    'country',
    'corporate',
    'luxury_lounge',
    'documentary',
    'faith_reflective',
    'travel_vlog',
    'lifestyle_vlog',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_mood_tag as enum (
    'calm',
    'emotional',
    'hopeful',
    'luxury',
    'stylish',
    'romantic',
    'playful',
    'funny',
    'serious',
    'cinematic',
    'premium',
    'energetic',
    'clean',
    'educational',
    'mysterious',
    'dramatic',
    'relaxed',
    'warm',
    'inspirational',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_energy_level as enum (
    'none',
    'very_low',
    'low',
    'medium_low',
    'medium',
    'medium_high',
    'high',
    'intense'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_energy_arc as enum (
    'flat',
    'gentle_build',
    'rise_and_resolve',
    'teaser_peak_then_drop',
    'montage_drive',
    'emotional_swell',
    'soft_resolve',
    'beat_drop',
    'chapter_hit',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_speech_safety as enum (
    'safe_under_voice',
    'needs_ducking',
    'not_safe_under_voice',
    'montage_only',
    'intro_outro_only',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_generation_purpose as enum (
    'project_specific_custom_music',
    'music_cue',
    'intro_music',
    'dialogue_bed',
    'montage_song',
    'outro_resolve',
    'reference_style_adaptation',
    'library_candidate',
    'regeneration',
    'variation',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_reuse_status as enum (
    'project_only',
    'candidate_for_library',
    'approved_for_internal_library',
    'rejected_for_reuse',
    'requires_terms_review',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_need_decision as enum (
    'music_needed',
    'music_optional',
    'ambience_only',
    'no_music',
    'needs_user_confirmation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_cue_count_decision as enum (
    'single_cue',
    'multi_cue',
    'ambience_only',
    'needs_analysis',
    'needs_user_confirmation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_qa_status as enum (
    'pending',
    'passed',
    'warning',
    'failed',
    'requires_regeneration',
    'requires_mix_adjustment',
    'waived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_qa_issue_type as enum (
    'unwanted_lyrics_under_voice',
    'wrong_mood',
    'wrong_culture_context',
    'too_loud_under_speech',
    'too_much_bass',
    'too_much_energy',
    'distracting_melody',
    'bad_loop_point',
    'weak_ending',
    'timing_mismatch',
    'generic_output',
    'audio_artifact',
    'does_not_match_reference_dna',
    'does_not_match_user_instruction',
    'license_or_provenance_missing',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_asset_origin as enum (
    'lyria_generated',
    'reeditpro_owned_sfx',
    'user_uploaded',
    'commissioned',
    'stock_licensed',
    'reference_only',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_license_scope as enum (
    'project_only',
    'workspace_only',
    'reeditpro_library',
    'user_provided',
    'commercial_allowed',
    'ads_allowed',
    'requires_review',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_usage_type as enum (
    'project_preview',
    'final_export',
    'revision_preview',
    'internal_library_preview',
    'reference_analysis_only',
    'other'
  );
exception
  when duplicate_object then null;
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
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_library_candidate_status as enum (
    'not_candidate',
    'candidate',
    'under_review',
    'approved',
    'rejected',
    'requires_terms_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_generation_status as enum (
    'draft',
    'planned',
    'awaiting_approval',
    'approved',
    'queued',
    'generating',
    'generated',
    'qa_pending',
    'qa_passed',
    'qa_failed',
    'ready_for_mix',
    'used_in_preview',
    'used_in_export',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

create table public.music_context_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  reference_asset_id uuid references public.reference_assets(id) on delete set null,
  primary_scene_type public.music_scene_type not null default 'custom',
  detected_scene_types public.music_scene_type[] not null default '{}'::public.music_scene_type[],
  video_topic text,
  setting_summary text,
  location_hints jsonb not null default '[]'::jsonb,
  culture_regions public.music_culture_region[] not null default '{}'::public.music_culture_region[],
  spoken_languages text[] not null default '{}'::text[],
  audience text,
  target_platform public.target_platform,
  music_need_decision public.music_need_decision not null default 'music_optional',
  cue_count_decision public.music_cue_count_decision not null default 'needs_analysis',
  speech_presence boolean not null default true,
  dialogue_heavy boolean not null default false,
  montage_sections_detected boolean not null default false,
  ambience_important boolean not null default true,
  reference_music_influence text,
  user_music_instructions text,
  avoid_music_instructions text,
  confidence public.planning_confidence not null default 'medium',
  analysis_payload jsonb not null default '{}'::jsonb,
  created_by_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_context_location_hints_array check (jsonb_typeof(location_hints) = 'array'),
  constraint music_context_analysis_payload_object check (jsonb_typeof(analysis_payload) = 'object')
);

comment on table public.music_context_analyses is
'Music context analysis happens before Lyria Pro prompt planning. ReeditPro must not generate random music.';
comment on column public.music_context_analyses.music_need_decision is
'Whether music is needed, optional, ambience-only, unnecessary, or requires user confirmation.';
comment on column public.music_context_analyses.cue_count_decision is
'Whether the edit should use one cue, multiple cues, ambience only, or needs more analysis/user confirmation.';

create table public.music_language_contexts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  music_context_analysis_id uuid not null references public.music_context_analyses(id) on delete cascade,
  spoken_language text,
  visual_location text,
  culture_region public.music_culture_region not null default 'unknown',
  recommended_lyric_language_policy public.lyric_language_policy not null default 'no_lyrics',
  allowed_lyric_languages text[] not null default '{}'::text[],
  avoid_languages text[] not null default '{}'::text[],
  culture_style_notes text,
  stereotype_avoidance_notes text,
  confidence public.planning_confidence not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.music_language_contexts is
'Language and culture music context. Culture-aware music should support context and taste without forcing stereotypes.';
comment on column public.music_language_contexts.stereotype_avoidance_notes is
'Notes that prevent lazy cultural stereotypes or forcing cultural music from location alone.';

create table public.music_style_taxonomy (
  id uuid primary key default gen_random_uuid(),
  taxonomy_key text not null unique,
  genre_family public.music_genre_family not null,
  display_name text not null,
  description text,
  common_moods public.music_mood_tag[] not null default '{}'::public.music_mood_tag[],
  common_instruments text[] not null default '{}'::text[],
  good_for_scene_types public.music_scene_type[] not null default '{}'::public.music_scene_type[],
  avoid_for_scene_types public.music_scene_type[] not null default '{}'::public.music_scene_type[],
  speech_safety_default public.music_speech_safety not null default 'needs_ducking',
  culture_region public.music_culture_region,
  example_prompt_phrases text[] not null default '{}'::text[],
  avoid_prompt_phrases text[] not null default '{}'::text[],
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_style_taxonomy_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.music_style_taxonomy is
'Reusable SoundSync genre, mood, language, culture, and speech-safety taxonomy. These are general style patterns only, not copyrighted song references.';

create table public.music_reference_dna (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  reference_asset_id uuid references public.reference_assets(id) on delete set null,
  reference_url text,
  summary text,
  cue_boundary_notes text,
  music_cue_count integer,
  genre_mood_per_cue jsonb not null default '[]'::jsonb,
  lyrics_moments jsonb not null default '[]'::jsonb,
  instrumental_moments jsonb not null default '[]'::jsonb,
  dialogue_ducking_behavior text,
  intro_music_behavior text,
  montage_music_behavior text,
  chapter_title_audio_behavior text,
  outro_resolve_behavior text,
  sfx_behavior text,
  ambience_behavior text,
  adaptation_rules jsonb not null default '[]'::jsonb,
  do_not_copy_rules jsonb not null default '[]'::jsonb,
  confidence public.planning_confidence not null default 'medium',
  created_by_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_reference_dna_cue_count_nonnegative check (music_cue_count is null or music_cue_count >= 0),
  constraint music_reference_dna_genre_mood_array check (jsonb_typeof(genre_mood_per_cue) = 'array'),
  constraint music_reference_dna_lyrics_array check (jsonb_typeof(lyrics_moments) = 'array'),
  constraint music_reference_dna_instrumental_array check (jsonb_typeof(instrumental_moments) = 'array'),
  constraint music_reference_dna_adaptation_array check (jsonb_typeof(adaptation_rules) = 'array'),
  constraint music_reference_dna_do_not_copy_array check (jsonb_typeof(do_not_copy_rules) = 'array')
);

comment on table public.music_reference_dna is
'Reference Music DNA stores style patterns only. It must not copy tracks, melodies, lyrics, or copyrighted music.';
comment on column public.music_reference_dna.do_not_copy_rules is
'Rules that prevent copying reference tracks, melodies, lyrics, chord signatures, or copyrighted arrangements.';

create table public.music_cue_sheets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  music_plan_id uuid references public.music_plans(id) on delete set null,
  music_context_analysis_id uuid references public.music_context_analyses(id) on delete set null,
  music_reference_dna_id uuid references public.music_reference_dna(id) on delete set null,
  cue_count_decision public.music_cue_count_decision not null default 'single_cue',
  summary text,
  overall_mood public.music_mood_tag not null default 'custom',
  overall_energy_arc public.music_energy_arc not null default 'flat',
  uses_multiple_cues boolean not null default false,
  lyrics_allowed_somewhere boolean not null default false,
  dialogue_safe_required boolean not null default true,
  reference_dna_used boolean not null default false,
  approval_required boolean not null default true,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  status public.music_generation_status not null default 'draft',
  notes text,
  cue_sheet_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_cue_sheets_payload_object check (jsonb_typeof(cue_sheet_payload) = 'object')
);

comment on table public.music_cue_sheets is
'Full music strategy for an edit. A cue sheet can contain one or many music cues; lifestyle/vacation edits often require multiple cues.';
comment on column public.music_cue_sheets.approval_required is
'Music generation must remain approval and credit gated before future Lyria Pro generation starts.';

create table public.music_cues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  music_cue_sheet_id uuid not null references public.music_cue_sheets(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  cue_order integer not null,
  cue_role public.music_cue_role not null,
  scene_type public.music_scene_type not null default 'custom',
  start_time_seconds numeric,
  end_time_seconds numeric,
  target_duration_seconds numeric,
  mood public.music_mood_tag not null default 'custom',
  genre_families public.music_genre_family[] not null default '{}'::public.music_genre_family[],
  energy_level public.music_energy_level not null default 'medium_low',
  energy_arc public.music_energy_arc not null default 'flat',
  culture_region public.music_culture_region not null default 'global',
  vocal_policy public.vocal_policy not null default 'instrumental_only',
  lyric_language_policy public.lyric_language_policy not null default 'no_lyrics',
  speech_safety public.music_speech_safety not null default 'safe_under_voice',
  instrumentation text[] not null default '{}'::text[],
  bpm_target integer,
  key_target text,
  reference_influence text,
  prompt_goal text,
  negative_prompt_goals text[] not null default '{}'::text[],
  ducking_required boolean not null default true,
  loopable_needed boolean not null default false,
  credit_impact text not null default 'medium',
  requires_approval boolean not null default true,
  status public.music_generation_status not null default 'draft',
  notes text,
  cue_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_cues_order_positive check (cue_order > 0),
  constraint music_cues_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint music_cues_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint music_cues_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint music_cues_duration_positive check (target_duration_seconds is null or target_duration_seconds > 0),
  constraint music_cues_bpm_positive check (bpm_target is null or bpm_target > 0),
  constraint music_cues_credit_impact_valid check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  constraint music_cues_payload_object check (jsonb_typeof(cue_payload) = 'object'),
  unique (music_cue_sheet_id, cue_order)
);

comment on table public.music_cues is
'Scene-level music cue records. A video can have multiple cues with different moods, genres, language policies, vocal policies, speech safety, and Lyria Pro prompt plans.';
comment on column public.music_cues.vocal_policy is
'Cue vocal policy. Lyrics are not allowed under important speech by default.';
comment on column public.music_cues.lyric_language_policy is
'Cue lyric language policy. Language choices should follow user intent, spoken language, setting, audience, and reference DNA.';
comment on column public.music_cues.speech_safety is
'Whether a cue is safe under voice, needs ducking, is montage-only, or belongs only in intro/outro sections.';
comment on column public.music_cues.culture_region is
'Culture/style region for the cue. Do not force cultural music from location alone.';

create table public.lyria_prompt_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  music_cue_sheet_id uuid references public.music_cue_sheets(id) on delete cascade,
  music_cue_id uuid references public.music_cues(id) on delete cascade,
  generation_purpose public.music_generation_purpose not null default 'music_cue',
  model_name text not null default 'lyria-3-pro-preview',
  provider_name text not null default 'Lyria Pro',
  prompt text not null,
  negative_prompt text,
  duration_seconds numeric,
  output_format text not null default 'wav_or_mp3',
  instrumental_only boolean not null default true,
  lyrics_allowed boolean not null default false,
  target_language text,
  timestamped_structure jsonb not null default '[]'::jsonb,
  style_constraints jsonb not null default '{}'::jsonb,
  timing_constraints jsonb not null default '{}'::jsonb,
  speech_safety_instructions text,
  culture_context_instructions text,
  quality_instructions text,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  status public.music_generation_status not null default 'planned',
  notes text,
  prompt_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lyria_prompt_plans_duration_positive check (duration_seconds is null or duration_seconds > 0),
  constraint lyria_prompt_plans_structure_array check (jsonb_typeof(timestamped_structure) = 'array'),
  constraint lyria_prompt_plans_style_object check (jsonb_typeof(style_constraints) = 'object'),
  constraint lyria_prompt_plans_timing_object check (jsonb_typeof(timing_constraints) = 'object'),
  constraint lyria_prompt_plans_payload_object check (jsonb_typeof(prompt_payload) = 'object')
);

comment on table public.lyria_prompt_plans is
'Future Lyria Pro prompt plans for custom music cues. This table stores prompts and planning metadata only; it does not call the API.';
comment on column public.lyria_prompt_plans.prompt is
'Professional music supervisor prompt planned before generation and before credit approval.';
comment on column public.lyria_prompt_plans.generation_request_id is
'Optional future generation request link after approval and credit reservation.';

create table public.lyria_prompt_segments (
  id uuid primary key default gen_random_uuid(),
  lyria_prompt_plan_id uuid not null references public.lyria_prompt_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  segment_order integer not null,
  start_time_seconds numeric,
  end_time_seconds numeric,
  purpose text,
  energy public.music_energy_level not null default 'medium_low',
  instrumentation text[] not null default '{}'::text[],
  lyric_instruction text,
  transition_instruction text,
  prompt_text text not null,
  created_at timestamptz not null default now(),
  constraint lyria_prompt_segments_order_positive check (segment_order > 0),
  constraint lyria_prompt_segments_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint lyria_prompt_segments_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint lyria_prompt_segments_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  unique (lyria_prompt_plan_id, segment_order)
);

comment on table public.lyria_prompt_segments is
'Timestamped structural sections inside a Lyria Pro prompt plan, such as intro build, montage drive, dialogue-safe bed, or outro resolve.';

create table public.generated_music_tracks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  music_cue_id uuid references public.music_cues(id) on delete set null,
  lyria_prompt_plan_id uuid references public.lyria_prompt_plans(id) on delete set null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  origin public.audio_asset_origin not null default 'lyria_generated',
  provider text not null default 'Lyria Pro',
  model text not null default 'lyria-3-pro-preview',
  prompt text,
  negative_prompt text,
  duration_seconds numeric,
  genre_families public.music_genre_family[] not null default '{}'::public.music_genre_family[],
  mood public.music_mood_tag not null default 'custom',
  energy_level public.music_energy_level not null default 'medium_low',
  culture_region public.music_culture_region not null default 'global',
  vocal_policy public.vocal_policy not null default 'instrumental_only',
  lyric_language_policy public.lyric_language_policy not null default 'no_lyrics',
  storage_path text,
  reuse_status public.music_reuse_status not null default 'project_only',
  qa_status public.music_qa_status not null default 'pending',
  used_in_render_id uuid references public.renders(id) on delete set null,
  used_in_export_id uuid references public.exports(id) on delete set null,
  license_provenance_id uuid null,
  notes text,
  track_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generated_music_tracks_duration_positive check (duration_seconds is null or duration_seconds > 0),
  constraint generated_music_tracks_payload_object check (jsonb_typeof(track_payload) = 'object')
);

comment on table public.generated_music_tracks is
'Generated music track records. Generated music starts as a project asset; reuse across users requires QA and terms review.';
comment on column public.generated_music_tracks.storage_path is
'Storage object path only. Do not store provider credentials, service role keys, signed URLs, or secrets.';
comment on column public.generated_music_tracks.reuse_status is
'Reuse status for generated music. Default project_only prevents assuming broad library reuse.';

create table public.music_track_analysis (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  generated_music_track_id uuid references public.generated_music_tracks(id) on delete cascade,
  audio_asset_id uuid references public.media_assets(id) on delete set null,
  bpm numeric,
  music_key text,
  loudness_lufs numeric,
  peak_db numeric,
  has_vocals boolean,
  detected_languages text[] not null default '{}'::text[],
  energy_level public.music_energy_level not null default 'medium_low',
  mood_tags public.music_mood_tag[] not null default '{}'::public.music_mood_tag[],
  instrument_tags text[] not null default '{}'::text[],
  loopable boolean not null default false,
  loop_start_seconds numeric,
  loop_end_seconds numeric,
  speech_safe public.music_speech_safety not null default 'unknown',
  artifact_score numeric,
  quality_score numeric,
  recommended_use text,
  warnings jsonb not null default '[]'::jsonb,
  analysis_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_track_analysis_bpm_positive check (bpm is null or bpm > 0),
  constraint music_track_analysis_artifact_range check (artifact_score is null or (artifact_score >= 0 and artifact_score <= 100)),
  constraint music_track_analysis_quality_range check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  constraint music_track_analysis_loop_start_nonnegative check (loop_start_seconds is null or loop_start_seconds >= 0),
  constraint music_track_analysis_loop_end_nonnegative check (loop_end_seconds is null or loop_end_seconds >= 0),
  constraint music_track_analysis_loop_range_valid check (
    loop_start_seconds is null
    or loop_end_seconds is null
    or loop_end_seconds >= loop_start_seconds
  ),
  constraint music_track_analysis_warnings_array check (jsonb_typeof(warnings) = 'array'),
  constraint music_track_analysis_payload_object check (jsonb_typeof(analysis_payload) = 'object')
);

comment on table public.music_track_analysis is
'Analysis of generated or imported music tracks, including vocals, language, BPM, key, loudness, loopability, quality, artifacts, and speech safety.';
comment on column public.music_track_analysis.speech_safe is
'Whether this analyzed track is safe under voice, needs ducking, is montage-only, or should not sit under speech.';

create table public.music_mix_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  music_cue_sheet_id uuid references public.music_cue_sheets(id) on delete cascade,
  music_cue_id uuid references public.music_cues(id) on delete set null,
  generated_music_track_id uuid references public.generated_music_tracks(id) on delete set null,
  volume_db_target numeric,
  ducking_strategy public.ducking_strategy not null default 'voice_first',
  ducking_amount_db numeric,
  duck_under_speech boolean not null default true,
  intro_fade_seconds numeric,
  outro_fade_seconds numeric,
  crossfade_with_previous_cue boolean not null default false,
  crossfade_with_next_cue boolean not null default false,
  beat_sync_points jsonb not null default '[]'::jsonb,
  silence_moments jsonb not null default '[]'::jsonb,
  ambient_bridge_needed boolean not null default false,
  sfx_relationship text,
  mix_notes text,
  status public.music_generation_status not null default 'planned',
  mix_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_mix_plans_intro_fade_nonnegative check (intro_fade_seconds is null or intro_fade_seconds >= 0),
  constraint music_mix_plans_outro_fade_nonnegative check (outro_fade_seconds is null or outro_fade_seconds >= 0),
  constraint music_mix_plans_beat_sync_array check (jsonb_typeof(beat_sync_points) = 'array'),
  constraint music_mix_plans_silence_array check (jsonb_typeof(silence_moments) = 'array'),
  constraint music_mix_plans_payload_object check (jsonb_typeof(mix_payload) = 'object')
);

comment on table public.music_mix_plans is
'Music mix and ducking decisions for cues or tracks. Sometimes the best music decision is no music or ambience only.';
comment on column public.music_mix_plans.ducking_strategy is
'Voice-first ducking strategy for keeping speech intelligible.';
comment on column public.music_mix_plans.silence_moments is
'Timeline moments where music should pause or stay out entirely.';

create table public.music_qa_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  music_cue_sheet_id uuid references public.music_cue_sheets(id) on delete cascade,
  music_cue_id uuid references public.music_cues(id) on delete set null,
  generated_music_track_id uuid references public.generated_music_tracks(id) on delete set null,
  status public.music_qa_status not null default 'pending',
  overall_score numeric,
  speech_safety_score numeric,
  context_fit_score numeric,
  culture_fit_score numeric,
  mood_fit_score numeric,
  mix_readiness_score numeric,
  recommended_action text,
  requires_regeneration boolean not null default false,
  requires_mix_adjustment boolean not null default false,
  approved_for_project boolean not null default false,
  approved_for_library_candidate boolean not null default false,
  notes text,
  qa_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_qa_reports_overall_range check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  constraint music_qa_reports_speech_range check (speech_safety_score is null or (speech_safety_score >= 0 and speech_safety_score <= 100)),
  constraint music_qa_reports_context_range check (context_fit_score is null or (context_fit_score >= 0 and context_fit_score <= 100)),
  constraint music_qa_reports_culture_range check (culture_fit_score is null or (culture_fit_score >= 0 and culture_fit_score <= 100)),
  constraint music_qa_reports_mood_range check (mood_fit_score is null or (mood_fit_score >= 0 and mood_fit_score <= 100)),
  constraint music_qa_reports_mix_range check (mix_readiness_score is null or (mix_readiness_score >= 0 and mix_readiness_score <= 100)),
  constraint music_qa_reports_payload_object check (jsonb_typeof(qa_payload) = 'object')
);

comment on table public.music_qa_reports is
'Music QA reports for generated music and cue plans, including speech safety, context fit, culture fit, mood fit, mix readiness, and regeneration decisions.';
comment on column public.music_qa_reports.approved_for_library_candidate is
'Approval to consider a generated track for future library review. This is not approval for reuse across all users.';

create table public.music_qa_issues (
  id uuid primary key default gen_random_uuid(),
  music_qa_report_id uuid not null references public.music_qa_reports(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  issue_type public.music_qa_issue_type not null,
  severity text not null default 'medium',
  description text not null,
  recommended_fix text,
  start_time_seconds numeric,
  end_time_seconds numeric,
  blocks_use boolean not null default false,
  issue_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint music_qa_issues_severity_valid check (severity in ('low', 'medium', 'high', 'critical')),
  constraint music_qa_issues_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint music_qa_issues_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint music_qa_issues_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint music_qa_issues_payload_object check (jsonb_typeof(issue_payload) = 'object')
);

comment on table public.music_qa_issues is
'Individual music QA issues, including unwanted lyrics under voice, wrong mood, cultural mismatch, loudness problems, artifacts, timing mismatch, or missing provenance.';

create table public.music_library_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  generated_music_track_id uuid not null references public.generated_music_tracks(id) on delete cascade,
  candidate_status public.music_library_candidate_status not null default 'candidate',
  reason text,
  quality_score numeric,
  reuse_status public.music_reuse_status not null default 'candidate_for_library',
  genre_families public.music_genre_family[] not null default '{}'::public.music_genre_family[],
  mood_tags public.music_mood_tag[] not null default '{}'::public.music_mood_tag[],
  culture_region public.music_culture_region not null default 'global',
  vocal_policy public.vocal_policy not null default 'instrumental_only',
  speech_safe boolean not null default false,
  license_review_required boolean not null default true,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint music_library_candidates_quality_range check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  constraint music_library_candidates_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.music_library_candidates is
'Generated tracks that may become part of ReeditPro internal music library. Promotion requires QA and terms/licensing review.';
comment on column public.music_library_candidates.license_review_required is
'True until provider and license terms confirm the generated track can be reused beyond the source project.';

create table public.audio_license_provenance (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  audio_asset_origin public.audio_asset_origin not null default 'unknown',
  provider text,
  model text,
  terms_version text,
  license_scope public.audio_license_scope not null default 'unknown',
  commercial_allowed boolean,
  ads_allowed boolean,
  client_work_allowed boolean,
  reuse_across_users_allowed boolean,
  requires_attribution boolean not null default false,
  user_provided boolean not null default false,
  license_notes text,
  source_url text,
  proof_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audio_license_provenance_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audio_license_provenance is
'License and provenance metadata for generated music, user uploads, stock/commissioned audio, and ReeditPro-owned SFX. Do not store secrets or provider keys.';
comment on column public.audio_license_provenance.reuse_across_users_allowed is
'Do not set true unless provider terms and ReeditPro review confirm cross-user reuse is allowed.';
comment on column public.audio_license_provenance.proof_storage_path is
'Storage path for non-secret proof or documentation. Do not store credentials, service role keys, or signed URLs.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'generated_music_tracks_license_provenance_id_fkey'
      and conrelid = 'public.generated_music_tracks'::regclass
  ) then
    alter table public.generated_music_tracks
    add constraint generated_music_tracks_license_provenance_id_fkey
    foreign key (license_provenance_id) references public.audio_license_provenance(id) on delete set null;
  end if;
end $$;

create table public.audio_usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  render_id uuid references public.renders(id) on delete set null,
  export_id uuid references public.exports(id) on delete set null,
  generated_music_track_id uuid references public.generated_music_tracks(id) on delete set null,
  generated_asset_id uuid references public.generated_assets(id) on delete set null,
  music_cue_id uuid references public.music_cues(id) on delete set null,
  license_provenance_id uuid references public.audio_license_provenance(id) on delete set null,
  usage_type public.audio_usage_type not null default 'project_preview',
  used_start_time_seconds numeric,
  used_end_time_seconds numeric,
  music_mix_plan_id uuid references public.music_mix_plans(id) on delete set null,
  usage_notes text,
  usage_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audio_usage_records_start_nonnegative check (used_start_time_seconds is null or used_start_time_seconds >= 0),
  constraint audio_usage_records_end_nonnegative check (used_end_time_seconds is null or used_end_time_seconds >= 0),
  constraint audio_usage_records_range_valid check (
    used_start_time_seconds is null
    or used_end_time_seconds is null
    or used_end_time_seconds >= used_start_time_seconds
  ),
  constraint audio_usage_records_payload_object check (jsonb_typeof(usage_payload) = 'object')
);

comment on table public.audio_usage_records is
'Audio usage records for preview, revision preview, final export, internal library preview, or reference-analysis-only use.';
comment on column public.audio_usage_records.usage_type is
'How the audio was used. Reference analysis records must not be treated as generated or licensed output.';

create table public.sfx_library_assets (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  origin public.audio_asset_origin not null default 'reeditpro_owned_sfx',
  sfx_use_case public.sfx_use_case not null default 'custom',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  storage_path text,
  duration_seconds numeric,
  license_provenance_id uuid references public.audio_license_provenance(id) on delete set null,
  safe_under_voice boolean not null default true,
  volume_category text not null default 'low',
  tags text[] not null default '{}'::text[],
  recommended_scene_types public.music_scene_type[] not null default '{}'::public.music_scene_type[],
  avoid_scene_types public.music_scene_type[] not null default '{}'::public.music_scene_type[],
  supports_signature_systems public.signature_system[] not null default '{}'::public.signature_system[],
  approved_for_use boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sfx_library_assets_duration_positive check (duration_seconds is null or duration_seconds > 0),
  constraint sfx_library_assets_volume_valid check (volume_category in ('none', 'low', 'medium', 'high')),
  constraint sfx_library_assets_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.sfx_library_assets is
'Bought, commissioned, or ReeditPro-owned SFX assets. SFX should be used only when it improves the edit and should avoid overpowering speech.';
comment on column public.sfx_library_assets.safe_under_voice is
'Whether this SFX can safely sit under important speech.';
comment on column public.sfx_library_assets.storage_path is
'Storage object path only. Do not store credentials, provider secrets, or signed URLs.';

insert into public.music_style_taxonomy (
  taxonomy_key,
  genre_family,
  display_name,
  description,
  common_moods,
  common_instruments,
  good_for_scene_types,
  avoid_for_scene_types,
  speech_safety_default,
  culture_region,
  example_prompt_phrases,
  avoid_prompt_phrases,
  metadata
)
values
  (
    'french_lifestyle_pop',
    'french_pop',
    'French Lifestyle Pop',
    'Stylish French pop and electro-lounge influence for non-speaking lifestyle montage moments.',
    array['stylish', 'relaxed', 'premium']::public.music_mood_tag[],
    array['warm guitar', 'soft bass', 'tasteful electronic lounge rhythm', 'airy vocal texture']::text[],
    array['lifestyle', 'vacation', 'travel_montage', 'city_walk']::public.music_scene_type[],
    array['dialogue', 'education', 'faith_reflective']::public.music_scene_type[],
    'montage_only',
    'france',
    array['French indie-pop inspired montage cue', 'tasteful electronic lounge rhythm', 'airy modern French vocal texture only in non-speaking moments']::text[],
    array['accordion cliche', 'imitate an existing song', 'lead vocals under dialogue']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'italian_luxury_travel',
    'italian_inspired_pop',
    'Italian Luxury Travel',
    'Elegant European travel music for scenic movement, villas, boats, and premium vacation pacing.',
    array['luxury', 'romantic', 'warm']::public.music_mood_tag[],
    array['warm acoustic guitar', 'gentle piano', 'brushed drums', 'elegant bass']::text[],
    array['vacation', 'travel_montage', 'boat_movement', 'luxury_showcase']::public.music_scene_type[],
    array['talking_head', 'education']::public.music_scene_type[],
    'needs_ducking',
    'european_luxury',
    array['Italian/elegant European luxury travel montage cue', 'premium lifestyle feel']::text[],
    array['aggressive EDM drops', 'tourist stereotype', 'copy reference melody']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'instrumental_dialogue_bed',
    'ambient',
    'Instrumental Dialogue Bed',
    'Voice-first instrumental bed with clean midrange space and predictable ducking behavior.',
    array['calm', 'clean', 'premium']::public.music_mood_tag[],
    array['soft piano', 'warm pads', 'subtle pulse', 'light texture']::text[],
    array['dialogue', 'narration', 'talking_head', 'education']::public.music_scene_type[],
    array['coming_up_teaser', 'fitness']::public.music_scene_type[],
    'safe_under_voice',
    null,
    array['instrumental-only premium background bed', 'designed to sit under voice']::text[],
    array['lyrics', 'lead vocal', 'busy melody', 'heavy bass']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'cinematic_premium_real_estate',
    'cinematic',
    'Cinematic Premium Real Estate',
    'Soft cinematic polish for walkthroughs where property ambience and voice clarity matter.',
    array['luxury', 'calm', 'premium']::public.music_mood_tag[],
    array['soft piano', 'warm pads', 'muted pulse', 'subtle strings']::text[],
    array['real_estate', 'luxury_showcase', 'ad_sales']::public.music_scene_type[],
    array['comedy', 'food_social']::public.music_scene_type[],
    'safe_under_voice',
    null,
    array['calm real estate walkthrough', 'slowly build during the property reveal']::text[],
    array['aggressive drums', 'dramatic trailer hits', 'vocals under agent voice']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'faith_reflective',
    'faith_reflective',
    'Faith Reflective',
    'Respectful reflective music for teaching, testimony, scripture, or pastoral storytelling.',
    array['hopeful', 'emotional', 'inspirational']::public.music_mood_tag[],
    array['soft piano', 'warm pads', 'gentle acoustic guitar', 'subtle strings']::text[],
    array['faith_reflective', 'education', 'narration']::public.music_scene_type[],
    array['comedy', 'ad_sales']::public.music_scene_type[],
    'safe_under_voice',
    null,
    array['reflective instrumental bed', 'respectful and voice-first']::text[],
    array['performance vocals under teaching', 'overly dramatic swell']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'high_energy_social',
    'pop',
    'High-Energy Social',
    'Bright social momentum for teasers, reveals, and fast montages without important speech.',
    array['energetic', 'playful', 'stylish']::public.music_mood_tag[],
    array['punchy drums', 'bright synths', 'bass hook', 'short vocal texture']::text[],
    array['coming_up_teaser', 'travel_montage', 'fitness', 'ad_sales']::public.music_scene_type[],
    array['dialogue', 'talking_head', 'faith_reflective']::public.music_scene_type[],
    'not_safe_under_voice',
    null,
    array['short teaser peak then drop', 'premium social energy']::text[],
    array['full lyrics under speech', 'harsh drums', 'unlicensed hook imitation']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  ),
  (
    'food_social_warmth',
    'jazz',
    'Food/Social Warmth',
    'Warm lounge, acoustic, or light jazz support for meals, friends, conversation, and social texture.',
    array['warm', 'playful', 'relaxed']::public.music_mood_tag[],
    array['light percussion', 'muted guitar', 'upright bass', 'soft piano']::text[],
    array['food_social', 'lifestyle', 'vacation']::public.music_scene_type[],
    array['fitness', 'ad_sales']::public.music_scene_type[],
    'needs_ducking',
    null,
    array['warm food and social moment', 'leave room for natural ambience']::text[],
    array['loud restaurant fake ambience', 'busy lead melody', 'lyrics over table dialogue']::text[],
    '{"seed":"rp_audio_03","copyrighted_references":false}'::jsonb
  )
on conflict (taxonomy_key) do update
set
  genre_family = excluded.genre_family,
  display_name = excluded.display_name,
  description = excluded.description,
  common_moods = excluded.common_moods,
  common_instruments = excluded.common_instruments,
  good_for_scene_types = excluded.good_for_scene_types,
  avoid_for_scene_types = excluded.avoid_for_scene_types,
  speech_safety_default = excluded.speech_safety_default,
  culture_region = excluded.culture_region,
  example_prompt_phrases = excluded.example_prompt_phrases,
  avoid_prompt_phrases = excluded.avoid_prompt_phrases,
  metadata = excluded.metadata,
  updated_at = now();

create index music_context_analyses_workspace_idx on public.music_context_analyses (workspace_id);
create index music_context_analyses_project_idx on public.music_context_analyses (project_id);
create index music_context_analyses_chat_session_idx on public.music_context_analyses (chat_session_id);
create index music_context_analyses_edit_plan_idx on public.music_context_analyses (edit_plan_id);
create index music_context_analyses_reference_asset_idx on public.music_context_analyses (reference_asset_id);
create index music_context_analyses_primary_scene_idx on public.music_context_analyses (primary_scene_type);
create index music_context_analyses_need_decision_idx on public.music_context_analyses (music_need_decision);
create index music_context_analyses_cue_count_idx on public.music_context_analyses (cue_count_decision);
create index music_context_analyses_confidence_idx on public.music_context_analyses (confidence);
create index music_context_analyses_detected_scene_gin_idx on public.music_context_analyses using gin (detected_scene_types);
create index music_context_analyses_culture_gin_idx on public.music_context_analyses using gin (culture_regions);

create index music_language_contexts_workspace_idx on public.music_language_contexts (workspace_id);
create index music_language_contexts_project_idx on public.music_language_contexts (project_id);
create index music_language_contexts_edit_plan_idx on public.music_language_contexts (edit_plan_id);
create index music_language_contexts_analysis_idx on public.music_language_contexts (music_context_analysis_id);
create index music_language_contexts_culture_idx on public.music_language_contexts (culture_region);
create index music_language_contexts_lyric_policy_idx on public.music_language_contexts (recommended_lyric_language_policy);
create index music_language_contexts_confidence_idx on public.music_language_contexts (confidence);

create index music_style_taxonomy_key_idx on public.music_style_taxonomy (taxonomy_key);
create index music_style_taxonomy_genre_idx on public.music_style_taxonomy (genre_family);
create index music_style_taxonomy_culture_idx on public.music_style_taxonomy (culture_region);
create index music_style_taxonomy_speech_idx on public.music_style_taxonomy (speech_safety_default);
create index music_style_taxonomy_active_idx on public.music_style_taxonomy (is_active);
create index music_style_taxonomy_moods_gin_idx on public.music_style_taxonomy using gin (common_moods);
create index music_style_taxonomy_scene_gin_idx on public.music_style_taxonomy using gin (good_for_scene_types);

create index music_reference_dna_workspace_idx on public.music_reference_dna (workspace_id);
create index music_reference_dna_project_idx on public.music_reference_dna (project_id);
create index music_reference_dna_reference_asset_idx on public.music_reference_dna (reference_asset_id);
create index music_reference_dna_confidence_idx on public.music_reference_dna (confidence);

create index music_cue_sheets_workspace_idx on public.music_cue_sheets (workspace_id);
create index music_cue_sheets_project_idx on public.music_cue_sheets (project_id);
create index music_cue_sheets_edit_plan_idx on public.music_cue_sheets (edit_plan_id);
create index music_cue_sheets_music_plan_idx on public.music_cue_sheets (music_plan_id);
create index music_cue_sheets_context_idx on public.music_cue_sheets (music_context_analysis_id);
create index music_cue_sheets_reference_dna_idx on public.music_cue_sheets (music_reference_dna_id);
create index music_cue_sheets_cue_count_idx on public.music_cue_sheets (cue_count_decision);
create index music_cue_sheets_status_idx on public.music_cue_sheets (status);
create index music_cue_sheets_credit_estimate_idx on public.music_cue_sheets (credit_estimate_id);

create index music_cues_workspace_idx on public.music_cues (workspace_id);
create index music_cues_project_idx on public.music_cues (project_id);
create index music_cues_edit_plan_idx on public.music_cues (edit_plan_id);
create index music_cues_sheet_idx on public.music_cues (music_cue_sheet_id);
create index music_cues_segment_idx on public.music_cues (edit_plan_segment_id);
create index music_cues_role_idx on public.music_cues (cue_role);
create index music_cues_scene_idx on public.music_cues (scene_type);
create index music_cues_mood_idx on public.music_cues (mood);
create index music_cues_energy_idx on public.music_cues (energy_level);
create index music_cues_culture_idx on public.music_cues (culture_region);
create index music_cues_vocal_idx on public.music_cues (vocal_policy);
create index music_cues_lyric_policy_idx on public.music_cues (lyric_language_policy);
create index music_cues_speech_safety_idx on public.music_cues (speech_safety);
create index music_cues_status_idx on public.music_cues (status);
create index music_cues_genre_gin_idx on public.music_cues using gin (genre_families);

create index lyria_prompt_plans_workspace_idx on public.lyria_prompt_plans (workspace_id);
create index lyria_prompt_plans_project_idx on public.lyria_prompt_plans (project_id);
create index lyria_prompt_plans_edit_plan_idx on public.lyria_prompt_plans (edit_plan_id);
create index lyria_prompt_plans_sheet_idx on public.lyria_prompt_plans (music_cue_sheet_id);
create index lyria_prompt_plans_cue_idx on public.lyria_prompt_plans (music_cue_id);
create index lyria_prompt_plans_purpose_idx on public.lyria_prompt_plans (generation_purpose);
create index lyria_prompt_plans_model_idx on public.lyria_prompt_plans (model_name);
create index lyria_prompt_plans_credit_idx on public.lyria_prompt_plans (credit_estimate_id);
create index lyria_prompt_plans_generation_request_idx on public.lyria_prompt_plans (generation_request_id);
create index lyria_prompt_plans_status_idx on public.lyria_prompt_plans (status);

create index lyria_prompt_segments_plan_idx on public.lyria_prompt_segments (lyria_prompt_plan_id);
create index lyria_prompt_segments_workspace_idx on public.lyria_prompt_segments (workspace_id);
create index lyria_prompt_segments_project_idx on public.lyria_prompt_segments (project_id);
create index lyria_prompt_segments_order_idx on public.lyria_prompt_segments (segment_order);
create index lyria_prompt_segments_energy_idx on public.lyria_prompt_segments (energy);

create index generated_music_tracks_workspace_idx on public.generated_music_tracks (workspace_id);
create index generated_music_tracks_project_idx on public.generated_music_tracks (project_id);
create index generated_music_tracks_edit_plan_idx on public.generated_music_tracks (edit_plan_id);
create index generated_music_tracks_cue_idx on public.generated_music_tracks (music_cue_id);
create index generated_music_tracks_prompt_plan_idx on public.generated_music_tracks (lyria_prompt_plan_id);
create index generated_music_tracks_generation_request_idx on public.generated_music_tracks (generation_request_id);
create index generated_music_tracks_generated_asset_idx on public.generated_music_tracks (generated_asset_id);
create index generated_music_tracks_origin_idx on public.generated_music_tracks (origin);
create index generated_music_tracks_provider_idx on public.generated_music_tracks (provider);
create index generated_music_tracks_model_idx on public.generated_music_tracks (model);
create index generated_music_tracks_culture_idx on public.generated_music_tracks (culture_region);
create index generated_music_tracks_vocal_idx on public.generated_music_tracks (vocal_policy);
create index generated_music_tracks_lyric_policy_idx on public.generated_music_tracks (lyric_language_policy);
create index generated_music_tracks_reuse_idx on public.generated_music_tracks (reuse_status);
create index generated_music_tracks_qa_idx on public.generated_music_tracks (qa_status);
create index generated_music_tracks_render_idx on public.generated_music_tracks (used_in_render_id);
create index generated_music_tracks_export_idx on public.generated_music_tracks (used_in_export_id);
create index generated_music_tracks_license_idx on public.generated_music_tracks (license_provenance_id);
create index generated_music_tracks_storage_path_idx on public.generated_music_tracks (storage_path);
create index generated_music_tracks_genre_gin_idx on public.generated_music_tracks using gin (genre_families);

create index music_track_analysis_workspace_idx on public.music_track_analysis (workspace_id);
create index music_track_analysis_project_idx on public.music_track_analysis (project_id);
create index music_track_analysis_track_idx on public.music_track_analysis (generated_music_track_id);
create index music_track_analysis_audio_asset_idx on public.music_track_analysis (audio_asset_id);
create index music_track_analysis_energy_idx on public.music_track_analysis (energy_level);
create index music_track_analysis_speech_safe_idx on public.music_track_analysis (speech_safe);
create index music_track_analysis_quality_idx on public.music_track_analysis (quality_score);
create index music_track_analysis_moods_gin_idx on public.music_track_analysis using gin (mood_tags);

create index music_mix_plans_workspace_idx on public.music_mix_plans (workspace_id);
create index music_mix_plans_project_idx on public.music_mix_plans (project_id);
create index music_mix_plans_edit_plan_idx on public.music_mix_plans (edit_plan_id);
create index music_mix_plans_sheet_idx on public.music_mix_plans (music_cue_sheet_id);
create index music_mix_plans_cue_idx on public.music_mix_plans (music_cue_id);
create index music_mix_plans_track_idx on public.music_mix_plans (generated_music_track_id);
create index music_mix_plans_ducking_idx on public.music_mix_plans (ducking_strategy);
create index music_mix_plans_status_idx on public.music_mix_plans (status);

create index music_qa_reports_workspace_idx on public.music_qa_reports (workspace_id);
create index music_qa_reports_project_idx on public.music_qa_reports (project_id);
create index music_qa_reports_edit_plan_idx on public.music_qa_reports (edit_plan_id);
create index music_qa_reports_sheet_idx on public.music_qa_reports (music_cue_sheet_id);
create index music_qa_reports_cue_idx on public.music_qa_reports (music_cue_id);
create index music_qa_reports_track_idx on public.music_qa_reports (generated_music_track_id);
create index music_qa_reports_status_idx on public.music_qa_reports (status);
create index music_qa_reports_requires_regen_idx on public.music_qa_reports (requires_regeneration);
create index music_qa_reports_requires_mix_idx on public.music_qa_reports (requires_mix_adjustment);
create index music_qa_reports_approved_project_idx on public.music_qa_reports (approved_for_project);
create index music_qa_reports_library_candidate_idx on public.music_qa_reports (approved_for_library_candidate);

create index music_qa_issues_report_idx on public.music_qa_issues (music_qa_report_id);
create index music_qa_issues_workspace_idx on public.music_qa_issues (workspace_id);
create index music_qa_issues_project_idx on public.music_qa_issues (project_id);
create index music_qa_issues_type_idx on public.music_qa_issues (issue_type);
create index music_qa_issues_severity_idx on public.music_qa_issues (severity);
create index music_qa_issues_blocks_idx on public.music_qa_issues (blocks_use);

create index music_library_candidates_workspace_idx on public.music_library_candidates (workspace_id);
create index music_library_candidates_project_idx on public.music_library_candidates (project_id);
create index music_library_candidates_track_idx on public.music_library_candidates (generated_music_track_id);
create index music_library_candidates_status_idx on public.music_library_candidates (candidate_status);
create index music_library_candidates_reuse_idx on public.music_library_candidates (reuse_status);
create index music_library_candidates_culture_idx on public.music_library_candidates (culture_region);
create index music_library_candidates_vocal_idx on public.music_library_candidates (vocal_policy);
create index music_library_candidates_speech_safe_idx on public.music_library_candidates (speech_safe);
create index music_library_candidates_license_review_idx on public.music_library_candidates (license_review_required);
create index music_library_candidates_approved_by_idx on public.music_library_candidates (approved_by);
create index music_library_candidates_approved_at_idx on public.music_library_candidates (approved_at);
create index music_library_candidates_genre_gin_idx on public.music_library_candidates using gin (genre_families);
create index music_library_candidates_mood_gin_idx on public.music_library_candidates using gin (mood_tags);

create index audio_license_provenance_workspace_idx on public.audio_license_provenance (workspace_id);
create index audio_license_provenance_project_idx on public.audio_license_provenance (project_id);
create index audio_license_provenance_origin_idx on public.audio_license_provenance (audio_asset_origin);
create index audio_license_provenance_provider_idx on public.audio_license_provenance (provider);
create index audio_license_provenance_model_idx on public.audio_license_provenance (model);
create index audio_license_provenance_scope_idx on public.audio_license_provenance (license_scope);
create index audio_license_provenance_commercial_idx on public.audio_license_provenance (commercial_allowed);
create index audio_license_provenance_ads_idx on public.audio_license_provenance (ads_allowed);
create index audio_license_provenance_user_provided_idx on public.audio_license_provenance (user_provided);
create index audio_license_provenance_reuse_idx on public.audio_license_provenance (reuse_across_users_allowed);

create index audio_usage_records_workspace_idx on public.audio_usage_records (workspace_id);
create index audio_usage_records_project_idx on public.audio_usage_records (project_id);
create index audio_usage_records_edit_plan_idx on public.audio_usage_records (edit_plan_id);
create index audio_usage_records_render_idx on public.audio_usage_records (render_id);
create index audio_usage_records_export_idx on public.audio_usage_records (export_id);
create index audio_usage_records_track_idx on public.audio_usage_records (generated_music_track_id);
create index audio_usage_records_generated_asset_idx on public.audio_usage_records (generated_asset_id);
create index audio_usage_records_music_cue_idx on public.audio_usage_records (music_cue_id);
create index audio_usage_records_license_idx on public.audio_usage_records (license_provenance_id);
create index audio_usage_records_usage_type_idx on public.audio_usage_records (usage_type);
create index audio_usage_records_mix_plan_idx on public.audio_usage_records (music_mix_plan_id);

create index sfx_library_assets_use_case_idx on public.sfx_library_assets (sfx_use_case);
create index sfx_library_assets_media_asset_idx on public.sfx_library_assets (media_asset_id);
create index sfx_library_assets_license_idx on public.sfx_library_assets (license_provenance_id);
create index sfx_library_assets_safe_voice_idx on public.sfx_library_assets (safe_under_voice);
create index sfx_library_assets_approved_idx on public.sfx_library_assets (approved_for_use);
create index sfx_library_assets_storage_path_idx on public.sfx_library_assets (storage_path);
create index sfx_library_assets_tags_gin_idx on public.sfx_library_assets using gin (tags);
create index sfx_library_assets_scene_gin_idx on public.sfx_library_assets using gin (recommended_scene_types);

create trigger music_context_analyses_set_updated_at
before update on public.music_context_analyses
for each row execute function public.set_updated_at();

create trigger music_language_contexts_set_updated_at
before update on public.music_language_contexts
for each row execute function public.set_updated_at();

create trigger music_style_taxonomy_set_updated_at
before update on public.music_style_taxonomy
for each row execute function public.set_updated_at();

create trigger music_reference_dna_set_updated_at
before update on public.music_reference_dna
for each row execute function public.set_updated_at();

create trigger music_cue_sheets_set_updated_at
before update on public.music_cue_sheets
for each row execute function public.set_updated_at();

create trigger music_cues_set_updated_at
before update on public.music_cues
for each row execute function public.set_updated_at();

create trigger lyria_prompt_plans_set_updated_at
before update on public.lyria_prompt_plans
for each row execute function public.set_updated_at();

create trigger generated_music_tracks_set_updated_at
before update on public.generated_music_tracks
for each row execute function public.set_updated_at();

create trigger music_track_analysis_set_updated_at
before update on public.music_track_analysis
for each row execute function public.set_updated_at();

create trigger music_mix_plans_set_updated_at
before update on public.music_mix_plans
for each row execute function public.set_updated_at();

create trigger music_qa_reports_set_updated_at
before update on public.music_qa_reports
for each row execute function public.set_updated_at();

create trigger music_library_candidates_set_updated_at
before update on public.music_library_candidates
for each row execute function public.set_updated_at();

create trigger audio_license_provenance_set_updated_at
before update on public.audio_license_provenance
for each row execute function public.set_updated_at();

create trigger sfx_library_assets_set_updated_at
before update on public.sfx_library_assets
for each row execute function public.set_updated_at();

alter table public.music_context_analyses enable row level security;
alter table public.music_language_contexts enable row level security;
alter table public.music_style_taxonomy enable row level security;
alter table public.music_reference_dna enable row level security;
alter table public.music_cue_sheets enable row level security;
alter table public.music_cues enable row level security;
alter table public.lyria_prompt_plans enable row level security;
alter table public.lyria_prompt_segments enable row level security;
alter table public.generated_music_tracks enable row level security;
alter table public.music_track_analysis enable row level security;
alter table public.music_mix_plans enable row level security;
alter table public.music_qa_reports enable row level security;
alter table public.music_qa_issues enable row level security;
alter table public.music_library_candidates enable row level security;
alter table public.audio_license_provenance enable row level security;
alter table public.audio_usage_records enable row level security;
alter table public.sfx_library_assets enable row level security;

create policy music_context_analyses_select_member
on public.music_context_analyses for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_context_analyses_insert_editor
on public.music_context_analyses for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_context_analyses_update_editor
on public.music_context_analyses for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_language_contexts_select_member
on public.music_language_contexts for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_language_contexts_insert_editor
on public.music_language_contexts for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_language_contexts_update_editor
on public.music_language_contexts for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_style_taxonomy_select_active
on public.music_style_taxonomy for select
to authenticated
using (is_active = true);

create policy music_reference_dna_select_member
on public.music_reference_dna for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_reference_dna_insert_editor
on public.music_reference_dna for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_reference_dna_update_editor
on public.music_reference_dna for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_cue_sheets_select_member
on public.music_cue_sheets for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_cue_sheets_insert_editor
on public.music_cue_sheets for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_cue_sheets_update_editor
on public.music_cue_sheets for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_cues_select_member
on public.music_cues for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_cues_insert_editor
on public.music_cues for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_cues_update_editor
on public.music_cues for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy lyria_prompt_plans_select_member
on public.lyria_prompt_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy lyria_prompt_plans_insert_editor
on public.lyria_prompt_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy lyria_prompt_plans_update_editor
on public.lyria_prompt_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy lyria_prompt_segments_select_member
on public.lyria_prompt_segments for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy lyria_prompt_segments_insert_editor
on public.lyria_prompt_segments for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy lyria_prompt_segments_update_editor
on public.lyria_prompt_segments for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy generated_music_tracks_select_member
on public.generated_music_tracks for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy generated_music_tracks_insert_editor
on public.generated_music_tracks for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy generated_music_tracks_update_editor
on public.generated_music_tracks for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_track_analysis_select_member
on public.music_track_analysis for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_track_analysis_insert_editor
on public.music_track_analysis for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_track_analysis_update_editor
on public.music_track_analysis for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_mix_plans_select_member
on public.music_mix_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_mix_plans_insert_editor
on public.music_mix_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_mix_plans_update_editor
on public.music_mix_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_qa_reports_select_member
on public.music_qa_reports for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_qa_reports_insert_editor
on public.music_qa_reports for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_qa_reports_update_editor
on public.music_qa_reports for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_qa_issues_select_member
on public.music_qa_issues for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_qa_issues_insert_editor
on public.music_qa_issues for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_qa_issues_update_editor
on public.music_qa_issues for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_library_candidates_select_member
on public.music_library_candidates for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy music_library_candidates_insert_editor
on public.music_library_candidates for insert
to authenticated
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_library_candidates_update_editor
on public.music_library_candidates for update
to authenticated
using (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_license_provenance_select_member
on public.audio_license_provenance for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy audio_license_provenance_insert_editor
on public.audio_license_provenance for insert
to authenticated
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_license_provenance_update_editor
on public.audio_license_provenance for update
to authenticated
using (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_usage_records_select_member
on public.audio_usage_records for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy audio_usage_records_insert_editor
on public.audio_usage_records for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_usage_records_update_editor
on public.audio_usage_records for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sfx_library_assets_select_approved
on public.sfx_library_assets for select
to authenticated
using (approved_for_use = true);

grant usage on type public.music_scene_type to authenticated, service_role;
grant usage on type public.music_cue_role to authenticated, service_role;
grant usage on type public.vocal_policy to authenticated, service_role;
grant usage on type public.lyric_language_policy to authenticated, service_role;
grant usage on type public.music_culture_region to authenticated, service_role;
grant usage on type public.music_genre_family to authenticated, service_role;
grant usage on type public.music_mood_tag to authenticated, service_role;
grant usage on type public.music_energy_level to authenticated, service_role;
grant usage on type public.music_energy_arc to authenticated, service_role;
grant usage on type public.music_speech_safety to authenticated, service_role;
grant usage on type public.music_generation_purpose to authenticated, service_role;
grant usage on type public.music_reuse_status to authenticated, service_role;
grant usage on type public.music_need_decision to authenticated, service_role;
grant usage on type public.music_cue_count_decision to authenticated, service_role;
grant usage on type public.music_qa_status to authenticated, service_role;
grant usage on type public.music_qa_issue_type to authenticated, service_role;
grant usage on type public.audio_asset_origin to authenticated, service_role;
grant usage on type public.audio_license_scope to authenticated, service_role;
grant usage on type public.audio_usage_type to authenticated, service_role;
grant usage on type public.sfx_use_case to authenticated, service_role;
grant usage on type public.music_library_candidate_status to authenticated, service_role;
grant usage on type public.music_generation_status to authenticated, service_role;

revoke all on table public.music_context_analyses from public, anon;
revoke all on table public.music_language_contexts from public, anon;
revoke all on table public.music_style_taxonomy from public, anon;
revoke all on table public.music_reference_dna from public, anon;
revoke all on table public.music_cue_sheets from public, anon;
revoke all on table public.music_cues from public, anon;
revoke all on table public.lyria_prompt_plans from public, anon;
revoke all on table public.lyria_prompt_segments from public, anon;
revoke all on table public.generated_music_tracks from public, anon;
revoke all on table public.music_track_analysis from public, anon;
revoke all on table public.music_mix_plans from public, anon;
revoke all on table public.music_qa_reports from public, anon;
revoke all on table public.music_qa_issues from public, anon;
revoke all on table public.music_library_candidates from public, anon;
revoke all on table public.audio_license_provenance from public, anon;
revoke all on table public.audio_usage_records from public, anon;
revoke all on table public.sfx_library_assets from public, anon;

grant select, insert, update on table public.music_context_analyses to authenticated;
grant select, insert, update on table public.music_language_contexts to authenticated;
grant select on table public.music_style_taxonomy to authenticated;
grant select, insert, update on table public.music_reference_dna to authenticated;
grant select, insert, update on table public.music_cue_sheets to authenticated;
grant select, insert, update on table public.music_cues to authenticated;
grant select, insert, update on table public.lyria_prompt_plans to authenticated;
grant select, insert, update on table public.lyria_prompt_segments to authenticated;
grant select, insert, update on table public.generated_music_tracks to authenticated;
grant select, insert, update on table public.music_track_analysis to authenticated;
grant select, insert, update on table public.music_mix_plans to authenticated;
grant select, insert, update on table public.music_qa_reports to authenticated;
grant select, insert, update on table public.music_qa_issues to authenticated;
grant select, insert, update on table public.music_library_candidates to authenticated;
grant select, insert, update on table public.audio_license_provenance to authenticated;
grant select, insert, update on table public.audio_usage_records to authenticated;
grant select on table public.sfx_library_assets to authenticated;

grant select, insert, update, delete on table public.music_context_analyses to service_role;
grant select, insert, update, delete on table public.music_language_contexts to service_role;
grant select, insert, update, delete on table public.music_style_taxonomy to service_role;
grant select, insert, update, delete on table public.music_reference_dna to service_role;
grant select, insert, update, delete on table public.music_cue_sheets to service_role;
grant select, insert, update, delete on table public.music_cues to service_role;
grant select, insert, update, delete on table public.lyria_prompt_plans to service_role;
grant select, insert, update, delete on table public.lyria_prompt_segments to service_role;
grant select, insert, update, delete on table public.generated_music_tracks to service_role;
grant select, insert, update, delete on table public.music_track_analysis to service_role;
grant select, insert, update, delete on table public.music_mix_plans to service_role;
grant select, insert, update, delete on table public.music_qa_reports to service_role;
grant select, insert, update, delete on table public.music_qa_issues to service_role;
grant select, insert, update, delete on table public.music_library_candidates to service_role;
grant select, insert, update, delete on table public.audio_license_provenance to service_role;
grant select, insert, update, delete on table public.audio_usage_records to service_role;
grant select, insert, update, delete on table public.sfx_library_assets to service_role;
