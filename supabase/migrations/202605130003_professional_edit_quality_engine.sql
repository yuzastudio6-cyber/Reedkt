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
  create type public.edit_quality_level as enum ('basic', 'pro', 'signature', 'premium_signature');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.professional_standard as enum (
    'clean_professional',
    'social_polished',
    'premium_brand',
    'cinematic',
    'educational_clear',
    'faith_respectful',
    'business_direct',
    'luxury_subtle',
    'energetic_social',
    'documentary_natural'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.generation_budget_level as enum ('low', 'balanced', 'high', 'premium');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transition_policy as enum (
    'none',
    'only_when_needed',
    'clean_cuts',
    'soft_contextual',
    'beat_matched',
    'story_matched',
    'premium_subtle'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_policy as enum (
    'none',
    'only_if_appropriate',
    'subtle_bed',
    'mood_support',
    'beat_driven',
    'premium_scoring',
    'reference_guided'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sfx_policy as enum (
    'none',
    'minimal',
    'subtle_when_needed',
    'motion_linked',
    'transition_linked',
    'premium_designed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_cleanup_policy as enum (
    'none',
    'light_cleanup',
    'voice_leveling',
    'noise_reduction',
    'room_tone_preserve',
    'dialogue_enhance',
    'heavy_repair'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.caption_policy as enum (
    'none',
    'basic_readable',
    'clean_social',
    'premium_subtle',
    'educational_clear',
    'word_emphasis',
    'brand_style'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.signature_policy as enum (
    'none_unless_requested',
    'allow_if_useful',
    'actively_investigate',
    'required_by_user',
    'premium_generation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.pacing_style as enum (
    'natural_clean',
    'tight_clean',
    'fast_social',
    'educational_clear',
    'premium_smooth',
    'cinematic_slow',
    'emotional_breathing',
    'sales_direct'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.speaker_energy as enum ('low', 'calm', 'medium', 'high', 'excited', 'serious', 'emotional');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.pause_quality as enum (
    'dead_space',
    'mistake_pause',
    'thinking_pause',
    'emotional_pause',
    'dramatic_pause',
    'natural_breath',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cut_type as enum (
    'remove_dead_space',
    'remove_mistake',
    'tighten_pause',
    'preserve_emotional_pause',
    'jump_cut',
    'j_cut',
    'l_cut',
    'match_cut',
    'cutaway_insert',
    'none'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transition_type as enum (
    'hard_cut',
    'soft_cut',
    'crossfade',
    'dip_to_black',
    'match_cut',
    'camera_motion_cut',
    'speed_ramp',
    'whip_pan',
    'push_transition',
    'wipe',
    'ambient_bridge',
    'none'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_environment_type as enum (
    'indoor_room',
    'office',
    'home_interior',
    'outdoor_street',
    'outdoor_nature',
    'vehicle',
    'restaurant',
    'crowd',
    'studio',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.noise_severity as enum ('none', 'low', 'medium', 'high', 'severe');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ambient_sound_type as enum (
    'room_tone',
    'office_room',
    'outdoor_street',
    'nature',
    'home_interior',
    'crowd_soft',
    'restaurant_soft',
    'real_estate_walkthrough',
    'silent_clean',
    'none'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_role as enum (
    'none',
    'subtle_bed',
    'emotional_support',
    'premium_polish',
    'energy_driver',
    'cinematic_build',
    'educational_background',
    'sales_momentum'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.music_energy as enum ('none', 'low', 'medium_low', 'medium', 'medium_high', 'high');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ducking_strategy as enum ('none', 'light', 'medium', 'strong', 'voice_first', 'beat_sensitive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sound_effect_type as enum (
    'none',
    'soft_whoosh',
    'light_hit',
    'success_chime',
    'transition_riser',
    'subtle_pop',
    'paper_swipe',
    'object_whoosh',
    'stroke_draw_sound',
    'ambient_bridge'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.caption_density as enum ('none', 'low', 'medium', 'high', 'word_by_word');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.caption_style_intent as enum (
    'basic_readable',
    'clean_social',
    'premium_subtle',
    'educational_clear',
    'emphasis_words',
    'brand_style'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.edit_quality_check_type as enum (
    'speech_clarity',
    'cut_smoothness',
    'caption_readability',
    'music_balance',
    'sfx_balance',
    'transition_quality',
    'ambient_consistency',
    'story_flow',
    'signature_timing',
    'credit_compliance',
    'user_instruction_compliance',
    'professional_standard'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.edit_quality_check_status as enum (
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

create table public.edit_quality_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  quality_level public.edit_quality_level not null,
  edit_complexity public.edit_complexity not null,
  professional_standard public.professional_standard not null default 'clean_professional',
  generation_budget_level public.generation_budget_level not null default 'low',
  pacing_style public.pacing_style not null default 'natural_clean',
  transition_policy public.transition_policy not null default 'only_when_needed',
  music_policy public.music_policy not null default 'only_if_appropriate',
  sfx_policy public.sfx_policy not null default 'minimal',
  audio_cleanup_policy public.audio_cleanup_policy not null default 'voice_leveling',
  caption_policy public.caption_policy not null default 'basic_readable',
  signature_policy public.signature_policy not null default 'none_unless_requested',
  quality_goal text,
  user_instruction_summary text,
  worker_notes text,
  profile_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edit_plan_id)
);

comment on table public.edit_quality_profiles is
'Defines the professional editing standard for an edit plan. Every ReeditPro edit, including Basic, must meet a professional standard. Basic means lower-compute clean editing, not low-quality editing.';
comment on column public.edit_quality_profiles.quality_level is
'Quality tier label for the edit quality engine. Quality level does not permit low-quality output.';
comment on column public.edit_quality_profiles.generation_budget_level is
'Budget/compute planning hint. Lower budget reduces generation depth and credit cost, not professional quality.';

create table public.pacing_analysis (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  story_beat_id uuid references public.story_beats(id) on delete set null,
  speaker_energy public.speaker_energy not null default 'medium',
  speech_speed text,
  pause_quality public.pause_quality not null default 'unknown',
  dead_space_detected boolean not null default false,
  emotional_intensity text,
  recommended_pacing public.pacing_style not null default 'natural_clean',
  cut_density text not null default 'medium' check (cut_density in ('low', 'medium', 'high', 'variable')),
  preserve_breaths boolean not null default false,
  preserve_emotional_pauses boolean not null default false,
  reason text,
  analysis_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pacing_analysis is
'Rhythm and pacing analysis for edit plans or segments, including whether pauses should be removed or preserved.';
comment on column public.pacing_analysis.preserve_emotional_pauses is
'Professional editing may preserve emotional pauses instead of cutting them for speed.';

create table public.cut_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  source_clip_sequence_item_id uuid references public.source_clip_sequence_items(id) on delete set null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  cut_order integer not null default 1 check (cut_order > 0),
  source_start_seconds numeric check (source_start_seconds is null or source_start_seconds >= 0),
  source_end_seconds numeric check (source_end_seconds is null or source_end_seconds >= 0),
  output_start_seconds numeric check (output_start_seconds is null or output_start_seconds >= 0),
  output_end_seconds numeric check (output_end_seconds is null or output_end_seconds >= 0),
  cut_type public.cut_type not null default 'none',
  cut_reason text not null,
  preserve_context boolean not null default true,
  affects_sentence boolean not null default false,
  confidence public.planning_confidence not null default 'medium',
  worker_note text,
  cut_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_end_seconds is null or source_start_seconds is null or source_end_seconds >= source_start_seconds),
  check (output_end_seconds is null or output_start_seconds is null or output_end_seconds >= output_start_seconds)
);

comment on table public.cut_decisions is
'Planned cut decisions. Every cut should have a reason; professional editing includes knowing when not to cut.';
comment on column public.cut_decisions.cut_type is
'The planned cut or non-cut decision, including preserving emotional pauses or choosing no cut.';

create table public.transition_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  from_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  to_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  transition_order integer not null default 1 check (transition_order > 0),
  transition_type public.transition_type not null default 'hard_cut',
  transition_reason text not null,
  mood text,
  speed text,
  sound_effect_needed boolean not null default false,
  music_sync_point text,
  credit_impact text not null default 'low' check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  worker_note text,
  transition_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transition_plans is
'Contextual transition decisions between segments. Transitions should depend on intent, tone, scene change, beat, platform, and professional standards, not random effects.';
comment on column public.transition_plans.transition_type is
'Transition type chosen for context, such as clean cuts for talking head, ambient bridge for location change, or premium subtle transitions for luxury edits.';

create table public.audio_environment_analysis (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  environment_type public.audio_environment_type not null default 'unknown',
  room_tone_type text,
  ambient_environment text,
  background_noise_type text,
  noise_severity public.noise_severity not null default 'low',
  reverb_level text,
  echo_level text,
  hum_detected boolean not null default false,
  wind_detected boolean not null default false,
  crowd_detected boolean not null default false,
  traffic_detected boolean not null default false,
  voice_clarity_score numeric check (voice_clarity_score is null or (voice_clarity_score >= 0 and voice_clarity_score <= 100)),
  recommended_cleanup public.audio_cleanup_policy not null default 'voice_leveling',
  preserve_natural_ambience boolean not null default true,
  notes text,
  analysis_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.audio_environment_analysis is
'Source audio environment understanding, including room tone, ambience, background noise, voice clarity, and cleanup needs.';
comment on column public.audio_environment_analysis.preserve_natural_ambience is
'Do not remove all ambience automatically. Some videos need natural room tone or environmental sound to feel professional.';

create table public.ambient_sound_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  audio_environment_analysis_id uuid references public.audio_environment_analysis(id) on delete set null,
  ambient_needed boolean not null default false,
  ambient_type public.ambient_sound_type not null default 'none',
  source_or_generated text not null default 'source' check (source_or_generated in ('source', 'generated', 'stock', 'none')),
  mix_level text not null default 'low' check (mix_level in ('none', 'low', 'medium', 'high')),
  transition_role text,
  reason text,
  worker_note text,
  ambient_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ambient_sound_plans is
'Plans for ambience and room tone in the final edit, including source ambience, generated ambience, stock ambience, or intentional silence.';

create table public.music_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  music_needed boolean not null default false,
  music_role public.music_role not null default 'none',
  music_mood text,
  music_energy public.music_energy not null default 'none',
  music_start_strategy text,
  music_end_strategy text,
  ducking_strategy public.ducking_strategy not null default 'voice_first',
  beat_sync_needed boolean not null default false,
  reference_music_influence text,
  license_source text,
  worker_note text,
  music_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.music_plans is
'Background music direction for the edit. Music is not always needed and should support voice, story, platform, mood, and user instructions.';
comment on column public.music_plans.music_role is
'The professional role music should play, such as subtle bed, emotional support, premium polish, or energy driver.';
comment on column public.music_plans.ducking_strategy is
'How music should lower under voice. ReeditPro should remain voice-first when speech is important.';

create table public.sound_effect_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  transition_plan_id uuid references public.transition_plans(id) on delete set null,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  sfx_needed boolean not null default false,
  sfx_type public.sound_effect_type not null default 'none',
  sfx_reason text,
  timing_anchor text,
  volume_level text not null default 'low' check (volume_level in ('none', 'low', 'medium', 'high')),
  avoid_overpowering_voice boolean not null default true,
  credit_impact text not null default 'low' check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  worker_note text,
  sfx_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sound_effect_plans is
'Sound effect decisions for transitions, motion, signature routes, and story emphasis. Basic edits usually use minimal or no SFX.';
comment on column public.sound_effect_plans.avoid_overpowering_voice is
'SFX must not overpower speech. Serious, educational, and faith/respectful content should be especially restrained.';

create table public.caption_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  caption_needed boolean not null default true,
  caption_policy public.caption_policy not null default 'basic_readable',
  caption_density public.caption_density not null default 'medium',
  style_intent public.caption_style_intent not null default 'basic_readable',
  positioning_strategy text,
  avoid_face_overlap boolean not null default true,
  avoid_visual_overlay_overlap boolean not null default true,
  word_emphasis_enabled boolean not null default false,
  editable_after_preview boolean not null default true,
  worker_note text,
  caption_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.caption_plans is
'Caption strategy for readability, density, placement, style intent, and post-preview editability.';
comment on column public.caption_plans.avoid_visual_overlay_overlap is
'Captions must avoid collision with faces, important objects, Stroke Motion, Graphic Design / VisualExplain, and Real Motion overlays.';

create table public.edit_quality_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  check_type public.edit_quality_check_type not null,
  status public.edit_quality_check_status not null default 'pending',
  score numeric check (score is null or (score >= 0 and score <= 100)),
  issue text,
  recommendation text,
  requires_retry boolean not null default false,
  checked_by text,
  check_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.edit_quality_checks is
'Lightweight edit-quality checks before preview. This is not the future full render-level QA report system.';
comment on column public.edit_quality_checks.requires_retry is
'True when a professional edit-quality issue should be retried before preview, such as unclear speech, bad music balance, caption overlap, or user instruction mismatch.';

create index edit_quality_profiles_workspace_id_idx on public.edit_quality_profiles (workspace_id);
create index edit_quality_profiles_project_id_idx on public.edit_quality_profiles (project_id);
create index edit_quality_profiles_edit_plan_id_idx on public.edit_quality_profiles (edit_plan_id);
create index edit_quality_profiles_quality_level_idx on public.edit_quality_profiles (quality_level);
create index edit_quality_profiles_edit_complexity_idx on public.edit_quality_profiles (edit_complexity);
create index edit_quality_profiles_professional_standard_idx on public.edit_quality_profiles (professional_standard);
create index edit_quality_profiles_generation_budget_level_idx on public.edit_quality_profiles (generation_budget_level);
create index pacing_analysis_workspace_id_idx on public.pacing_analysis (workspace_id);
create index pacing_analysis_project_id_idx on public.pacing_analysis (project_id);
create index pacing_analysis_edit_plan_id_idx on public.pacing_analysis (edit_plan_id);
create index pacing_analysis_segment_id_idx on public.pacing_analysis (edit_plan_segment_id);
create index pacing_analysis_story_beat_id_idx on public.pacing_analysis (story_beat_id);
create index pacing_analysis_speaker_energy_idx on public.pacing_analysis (speaker_energy);
create index pacing_analysis_pause_quality_idx on public.pacing_analysis (pause_quality);
create index pacing_analysis_recommended_pacing_idx on public.pacing_analysis (recommended_pacing);
create index cut_decisions_workspace_id_idx on public.cut_decisions (workspace_id);
create index cut_decisions_project_id_idx on public.cut_decisions (project_id);
create index cut_decisions_edit_plan_id_idx on public.cut_decisions (edit_plan_id);
create index cut_decisions_segment_id_idx on public.cut_decisions (edit_plan_segment_id);
create index cut_decisions_source_clip_item_id_idx on public.cut_decisions (source_clip_sequence_item_id);
create index cut_decisions_media_asset_id_idx on public.cut_decisions (media_asset_id);
create index cut_decisions_cut_order_idx on public.cut_decisions (cut_order);
create index cut_decisions_cut_type_idx on public.cut_decisions (cut_type);
create index transition_plans_workspace_id_idx on public.transition_plans (workspace_id);
create index transition_plans_project_id_idx on public.transition_plans (project_id);
create index transition_plans_edit_plan_id_idx on public.transition_plans (edit_plan_id);
create index transition_plans_from_segment_id_idx on public.transition_plans (from_segment_id);
create index transition_plans_to_segment_id_idx on public.transition_plans (to_segment_id);
create index transition_plans_transition_order_idx on public.transition_plans (transition_order);
create index transition_plans_transition_type_idx on public.transition_plans (transition_type);
create index transition_plans_sound_effect_needed_idx on public.transition_plans (sound_effect_needed);
create index audio_environment_analysis_workspace_id_idx on public.audio_environment_analysis (workspace_id);
create index audio_environment_analysis_project_id_idx on public.audio_environment_analysis (project_id);
create index audio_environment_analysis_media_asset_id_idx on public.audio_environment_analysis (media_asset_id);
create index audio_environment_analysis_edit_plan_id_idx on public.audio_environment_analysis (edit_plan_id);
create index audio_environment_analysis_segment_id_idx on public.audio_environment_analysis (edit_plan_segment_id);
create index audio_environment_analysis_environment_type_idx on public.audio_environment_analysis (environment_type);
create index audio_environment_analysis_noise_severity_idx on public.audio_environment_analysis (noise_severity);
create index audio_environment_analysis_recommended_cleanup_idx on public.audio_environment_analysis (recommended_cleanup);
create index ambient_sound_plans_workspace_id_idx on public.ambient_sound_plans (workspace_id);
create index ambient_sound_plans_project_id_idx on public.ambient_sound_plans (project_id);
create index ambient_sound_plans_edit_plan_id_idx on public.ambient_sound_plans (edit_plan_id);
create index ambient_sound_plans_segment_id_idx on public.ambient_sound_plans (edit_plan_segment_id);
create index ambient_sound_plans_ambient_type_idx on public.ambient_sound_plans (ambient_type);
create index ambient_sound_plans_ambient_needed_idx on public.ambient_sound_plans (ambient_needed);
create index music_plans_workspace_id_idx on public.music_plans (workspace_id);
create index music_plans_project_id_idx on public.music_plans (project_id);
create index music_plans_edit_plan_id_idx on public.music_plans (edit_plan_id);
create index music_plans_music_needed_idx on public.music_plans (music_needed);
create index music_plans_music_role_idx on public.music_plans (music_role);
create index music_plans_music_energy_idx on public.music_plans (music_energy);
create index music_plans_beat_sync_needed_idx on public.music_plans (beat_sync_needed);
create index sound_effect_plans_workspace_id_idx on public.sound_effect_plans (workspace_id);
create index sound_effect_plans_project_id_idx on public.sound_effect_plans (project_id);
create index sound_effect_plans_edit_plan_id_idx on public.sound_effect_plans (edit_plan_id);
create index sound_effect_plans_segment_id_idx on public.sound_effect_plans (edit_plan_segment_id);
create index sound_effect_plans_transition_plan_id_idx on public.sound_effect_plans (transition_plan_id);
create index sound_effect_plans_signature_route_id_idx on public.sound_effect_plans (signature_route_id);
create index sound_effect_plans_sfx_needed_idx on public.sound_effect_plans (sfx_needed);
create index sound_effect_plans_sfx_type_idx on public.sound_effect_plans (sfx_type);
create index caption_plans_workspace_id_idx on public.caption_plans (workspace_id);
create index caption_plans_project_id_idx on public.caption_plans (project_id);
create index caption_plans_edit_plan_id_idx on public.caption_plans (edit_plan_id);
create index caption_plans_caption_needed_idx on public.caption_plans (caption_needed);
create index caption_plans_caption_policy_idx on public.caption_plans (caption_policy);
create index caption_plans_caption_density_idx on public.caption_plans (caption_density);
create index caption_plans_style_intent_idx on public.caption_plans (style_intent);
create index edit_quality_checks_workspace_id_idx on public.edit_quality_checks (workspace_id);
create index edit_quality_checks_project_id_idx on public.edit_quality_checks (project_id);
create index edit_quality_checks_edit_plan_id_idx on public.edit_quality_checks (edit_plan_id);
create index edit_quality_checks_segment_id_idx on public.edit_quality_checks (edit_plan_segment_id);
create index edit_quality_checks_check_type_idx on public.edit_quality_checks (check_type);
create index edit_quality_checks_status_idx on public.edit_quality_checks (status);
create index edit_quality_checks_requires_retry_idx on public.edit_quality_checks (requires_retry);

create trigger edit_quality_profiles_set_updated_at
before update on public.edit_quality_profiles
for each row execute function public.set_updated_at();

create trigger pacing_analysis_set_updated_at
before update on public.pacing_analysis
for each row execute function public.set_updated_at();

create trigger cut_decisions_set_updated_at
before update on public.cut_decisions
for each row execute function public.set_updated_at();

create trigger transition_plans_set_updated_at
before update on public.transition_plans
for each row execute function public.set_updated_at();

create trigger audio_environment_analysis_set_updated_at
before update on public.audio_environment_analysis
for each row execute function public.set_updated_at();

create trigger ambient_sound_plans_set_updated_at
before update on public.ambient_sound_plans
for each row execute function public.set_updated_at();

create trigger music_plans_set_updated_at
before update on public.music_plans
for each row execute function public.set_updated_at();

create trigger sound_effect_plans_set_updated_at
before update on public.sound_effect_plans
for each row execute function public.set_updated_at();

create trigger caption_plans_set_updated_at
before update on public.caption_plans
for each row execute function public.set_updated_at();

create trigger edit_quality_checks_set_updated_at
before update on public.edit_quality_checks
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_workspace_role(target_workspace_id, array['owner', 'admin']::public.workspace_role[]);
$$;

alter table public.edit_quality_profiles enable row level security;
alter table public.pacing_analysis enable row level security;
alter table public.cut_decisions enable row level security;
alter table public.transition_plans enable row level security;
alter table public.audio_environment_analysis enable row level security;
alter table public.ambient_sound_plans enable row level security;
alter table public.music_plans enable row level security;
alter table public.sound_effect_plans enable row level security;
alter table public.caption_plans enable row level security;
alter table public.edit_quality_checks enable row level security;

create policy edit_quality_profiles_select_member
on public.edit_quality_profiles for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_quality_profiles_insert_editor
on public.edit_quality_profiles for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_quality_profiles_update_editor
on public.edit_quality_profiles for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy pacing_analysis_select_member
on public.pacing_analysis for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy pacing_analysis_insert_editor
on public.pacing_analysis for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy pacing_analysis_update_editor
on public.pacing_analysis for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy cut_decisions_select_member
on public.cut_decisions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy cut_decisions_insert_editor
on public.cut_decisions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy cut_decisions_update_editor
on public.cut_decisions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy transition_plans_select_member
on public.transition_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy transition_plans_insert_editor
on public.transition_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy transition_plans_update_editor
on public.transition_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_environment_analysis_select_member
on public.audio_environment_analysis for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy audio_environment_analysis_insert_editor
on public.audio_environment_analysis for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy audio_environment_analysis_update_editor
on public.audio_environment_analysis for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy ambient_sound_plans_select_member
on public.ambient_sound_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy ambient_sound_plans_insert_editor
on public.ambient_sound_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy ambient_sound_plans_update_editor
on public.ambient_sound_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_plans_select_member
on public.music_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy music_plans_insert_editor
on public.music_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy music_plans_update_editor
on public.music_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sound_effect_plans_select_member
on public.sound_effect_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy sound_effect_plans_insert_editor
on public.sound_effect_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy sound_effect_plans_update_editor
on public.sound_effect_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy caption_plans_select_member
on public.caption_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy caption_plans_insert_editor
on public.caption_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy caption_plans_update_editor
on public.caption_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_quality_checks_select_member
on public.edit_quality_checks for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_quality_checks_insert_editor
on public.edit_quality_checks for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_quality_checks_update_editor
on public.edit_quality_checks for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
