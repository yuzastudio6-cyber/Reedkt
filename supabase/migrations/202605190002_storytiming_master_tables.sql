-- RP-TIMING-03 - StoryTiming Master Tables
-- Local schema artifact only. Do not run against production until reviewed and tested.
-- This migration does not connect to remote Supabase, call providers, store credentials,
-- create Google Cloud resources, render media, or replace existing distributed timing records.

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
  create type public.story_timing_source_system as enum (
    'edit_plan',
    'story_beat',
    'pacing_analysis',
    'cut_decision',
    'transition_plan',
    'caption_plan',
    'signature_route',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'music_cue',
    'music_mix',
    'sfx_event',
    'sfx_trim',
    'sfx_alignment',
    'sfx_mix',
    'render_job',
    'qa_report',
    'review_comment',
    'manual',
    'unknown'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_map_status as enum (
    'draft',
    'planning',
    'awaiting_approval',
    'approved',
    'locked_for_generation',
    'render_ready',
    'revision_requested',
    'superseded',
    'cancelled',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_track_type as enum (
    'source_video',
    'output_video',
    'transcript',
    'story_beats',
    'cuts',
    'transitions',
    'captions',
    'music',
    'sfx',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'cta',
    'render_markers',
    'qa_markers',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_anchor_type as enum (
    'word',
    'phrase',
    'sentence',
    'pause',
    'breath',
    'emotional_shift',
    'scene_change',
    'cut',
    'transition_start',
    'transition_end',
    'music_beat',
    'music_downbeat',
    'music_drop',
    'music_resolve',
    'sfx_hit',
    'sfx_tail',
    'caption_reveal',
    'caption_emphasis',
    'stroke_motion_start',
    'stroke_motion_completion',
    'graphic_reveal',
    'real_motion_object_enter',
    'real_motion_object_settle',
    'cta_reveal',
    'chapter_title',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_event_type as enum (
    'cut',
    'caption_on',
    'caption_off',
    'caption_emphasis',
    'music_cue_start',
    'music_cue_end',
    'music_duck_start',
    'music_duck_end',
    'sfx_start',
    'sfx_hit',
    'sfx_end',
    'stroke_motion_start',
    'stroke_motion_beat',
    'stroke_motion_complete',
    'graphic_reveal',
    'graphic_hide',
    'real_motion_enter',
    'real_motion_settle',
    'transition_start',
    'transition_end',
    'cta_reveal',
    'render_marker',
    'qa_marker',
    'manual_marker'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_authority as enum (
    'user_instruction',
    'speech_meaning',
    'story_beat',
    'emotional_timing',
    'caption_readability',
    'visual_comprehension',
    'music_rhythm',
    'sfx_hit',
    'signature_animation',
    'platform_pacing',
    'manual_override'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_priority as enum (
    'critical',
    'high',
    'medium',
    'low',
    'decorative'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_sync_mode as enum (
    'speech_locked',
    'word_locked',
    'phrase_locked',
    'beat_locked',
    'frame_locked',
    'emotion_locked',
    'visual_motion_locked',
    'loose',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_conflict_type as enum (
    'caption_overlay_collision',
    'caption_too_fast',
    'caption_too_late',
    'cut_before_meaning_complete',
    'emotional_pause_removed',
    'music_ducking_misses_speech',
    'sfx_hit_late',
    'sfx_hit_early',
    'sfx_tail_over_speech',
    'stroke_motion_late',
    'stroke_motion_too_fast',
    'graphic_reveal_too_early',
    'graphic_not_readable_long_enough',
    'real_motion_blocks_face',
    'transition_cuts_story_beat',
    'too_many_events_same_moment',
    'overall_pacing_too_rushed',
    'overall_pacing_too_slow',
    'manual_review_needed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_conflict_severity as enum (
    'low',
    'medium',
    'high',
    'critical'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_dependency_type as enum (
    'starts_after',
    'starts_before',
    'ends_before',
    'ends_after',
    'must_overlap',
    'must_not_overlap',
    'hit_on_same_frame',
    'sync_to_anchor',
    'duck_during',
    'hide_during',
    'manual'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_adjustment_type as enum (
    'shift_earlier',
    'shift_later',
    'extend_duration',
    'shorten_duration',
    'move_to_different_anchor',
    'reduce_overlap',
    'add_ducking',
    'remove_event',
    'preserve_pause',
    'manual_review'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_qa_check_type as enum (
    'caption_sync',
    'caption_readability_duration',
    'caption_overlay_collision',
    'speech_cut_integrity',
    'emotional_pause_preservation',
    'music_beat_alignment',
    'music_ducking_timing',
    'sfx_hit_alignment',
    'sfx_tail_safety',
    'transition_timing',
    'stroke_motion_word_sync',
    'graphic_readability_time',
    'real_motion_entry_exit_timing',
    'real_motion_face_safety',
    'overall_rhythm',
    'platform_pacing',
    'render_manifest_integrity'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_timing_qa_check_status as enum (
    'pending',
    'passed',
    'warning',
    'failed',
    'requires_adjustment',
    'requires_manual_review',
    'waived'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.render_timing_manifest_status as enum (
    'draft',
    'ready_for_worker',
    'rendering',
    'rendered',
    'failed',
    'superseded'
  );
exception when duplicate_object then null;
end $$;

create table public.master_timing_maps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  version integer not null default 1,
  status public.story_timing_map_status not null default 'draft',
  duration_seconds numeric,
  frame_rate numeric,
  timebase jsonb not null default '{"unit":"seconds","frameRoundingMode":"round"}'::jsonb,
  primary_timing_authority public.story_timing_authority not null default 'speech_meaning',
  timing_hierarchy public.story_timing_authority[] not null default array[
    'user_instruction',
    'speech_meaning',
    'story_beat',
    'emotional_timing',
    'caption_readability',
    'visual_comprehension',
    'music_rhythm',
    'sfx_hit',
    'signature_animation',
    'platform_pacing'
  ]::public.story_timing_authority[],
  source_systems_included public.story_timing_source_system[] not null default '{}'::public.story_timing_source_system[],
  locked_for_generation boolean not null default false,
  approved_by_user_id uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  summary text,
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_timing_maps_version_positive check (version > 0),
  constraint master_timing_maps_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint master_timing_maps_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint master_timing_maps_timebase_object check (jsonb_typeof(timebase) = 'object'),
  constraint master_timing_maps_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint master_timing_maps_metadata_object check (jsonb_typeof(metadata) = 'object'),
  unique (edit_plan_id, version)
);

comment on table public.master_timing_maps is
'StoryTiming master maps consolidate existing ReeditPro timing records across edit plans, story beats, cuts, captions, music, SFX, signature overlays, render markers, and QA. They coordinate timing but do not replace the source records.';
comment on column public.master_timing_maps.timebase is
'Structured timing base for frame-accurate execution, aligned with StoryTimingTimebase in TypeScript.';
comment on column public.master_timing_maps.source_systems_included is
'Distributed source systems included in the master timing map. Source records keep their native timing fields.';
comment on column public.master_timing_maps.locked_for_generation is
'True when the timing map is frozen for future generation/render workers.';

create table public.story_timing_segments (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  story_beat_id uuid references public.story_beats(id) on delete set null,
  segment_order integer not null,
  source_start_seconds numeric,
  source_end_seconds numeric,
  output_start_seconds numeric not null,
  output_end_seconds numeric not null,
  purpose text,
  primary_authority public.story_timing_authority not null default 'speech_meaning',
  pacing_style text,
  has_speech boolean not null default true,
  has_music boolean not null default false,
  has_sfx boolean not null default false,
  has_captions boolean not null default true,
  has_signature_overlay boolean not null default false,
  preserve_emotional_pause boolean not null default false,
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_timing_segments_order_positive check (segment_order > 0),
  constraint story_timing_segments_source_start_nonnegative check (source_start_seconds is null or source_start_seconds >= 0),
  constraint story_timing_segments_source_end_nonnegative check (source_end_seconds is null or source_end_seconds >= 0),
  constraint story_timing_segments_source_range_valid check (
    source_start_seconds is null
    or source_end_seconds is null
    or source_end_seconds >= source_start_seconds
  ),
  constraint story_timing_segments_output_start_nonnegative check (output_start_seconds >= 0),
  constraint story_timing_segments_output_range_valid check (output_end_seconds >= output_start_seconds),
  constraint story_timing_segments_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint story_timing_segments_metadata_object check (jsonb_typeof(metadata) = 'object'),
  unique (master_timing_map_id, segment_order)
);

comment on table public.story_timing_segments is
'Segment-level timing windows inside a master timing map, derived from edit plan segments, story beats, cuts, and timing coordination needs.';
comment on column public.story_timing_segments.preserve_emotional_pause is
'Marks segments where meaningful pauses should not be removed for pacing or beat alignment.';

create table public.timing_anchors (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  story_timing_segment_id uuid references public.story_timing_segments(id) on delete set null,
  source_system public.story_timing_source_system not null default 'unknown',
  source_record_id uuid,
  source_table_name text,
  anchor_type public.story_timing_anchor_type not null,
  anchor_label text not null,
  anchor_text text,
  time_seconds numeric not null,
  end_time_seconds numeric,
  frame_number integer,
  importance public.story_timing_priority not null default 'medium',
  primary_authority public.story_timing_authority not null default 'speech_meaning',
  sync_mode public.story_timing_sync_mode not null default 'loose',
  locked boolean not null default false,
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timing_anchors_time_nonnegative check (time_seconds >= 0),
  constraint timing_anchors_end_valid check (end_time_seconds is null or end_time_seconds >= time_seconds),
  constraint timing_anchors_frame_nonnegative check (frame_number is null or frame_number >= 0),
  constraint timing_anchors_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint timing_anchors_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.timing_anchors is
'Shared reference points for captions, cuts, transitions, music, SFX, signature animation, render events, and QA timing.';
comment on column public.timing_anchors.source_system is
'Native source system for this anchor. The source record keeps its original timing field.';
comment on column public.timing_anchors.source_record_id is
'Optional polymorphic source record ID. FKs are intentionally avoided for distributed timing systems.';
comment on column public.timing_anchors.locked is
'Locked anchors should not be shifted by future timing services without approval.';

create table public.timing_events (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  story_timing_segment_id uuid references public.story_timing_segments(id) on delete set null,
  anchor_id uuid references public.timing_anchors(id) on delete set null,
  source_system public.story_timing_source_system not null default 'unknown',
  source_record_id uuid,
  source_table_name text,
  event_type public.story_timing_event_type not null,
  track_type public.story_timing_track_type not null,
  label text not null,
  start_time_seconds numeric not null,
  hit_time_seconds numeric,
  end_time_seconds numeric not null,
  duration_seconds numeric,
  frame_start integer,
  frame_hit integer,
  frame_end integer,
  priority public.story_timing_priority not null default 'medium',
  sync_mode public.story_timing_sync_mode not null default 'loose',
  can_shift boolean not null default true,
  locked boolean not null default false,
  visibility_layer text,
  audio_layer text,
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timing_events_start_nonnegative check (start_time_seconds >= 0),
  constraint timing_events_hit_nonnegative check (hit_time_seconds is null or hit_time_seconds >= 0),
  constraint timing_events_range_valid check (end_time_seconds >= start_time_seconds),
  constraint timing_events_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint timing_events_frame_start_nonnegative check (frame_start is null or frame_start >= 0),
  constraint timing_events_frame_hit_nonnegative check (frame_hit is null or frame_hit >= 0),
  constraint timing_events_frame_end_nonnegative check (frame_end is null or frame_end >= 0),
  constraint timing_events_frame_range_valid check (
    frame_start is null
    or frame_end is null
    or frame_end >= frame_start
  ),
  constraint timing_events_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint timing_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.timing_events is
'Timeline events for captions, cuts, transitions, SFX start/hit/end, music cues and ducking, signature animation, render markers, and QA markers.';
comment on column public.timing_events.source_system is
'Native source system for this event. StoryTiming coordinates it without replacing the source timing record.';
comment on column public.timing_events.hit_time_seconds is
'Optional hit point for events where the impact frame matters more than the file or animation start.';
comment on column public.timing_events.can_shift is
'Whether future timing services may move the event to resolve conflicts.';
comment on column public.timing_events.locked is
'Locked events should not shift without explicit approval or a new timing version.';

create table public.timing_dependencies (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  from_event_id uuid references public.timing_events(id) on delete cascade,
  to_event_id uuid references public.timing_events(id) on delete cascade,
  from_anchor_id uuid references public.timing_anchors(id) on delete cascade,
  to_anchor_id uuid references public.timing_anchors(id) on delete cascade,
  dependency_type public.story_timing_dependency_type not null,
  min_offset_seconds numeric,
  max_offset_seconds numeric,
  required boolean not null default true,
  reason text,
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timing_dependencies_from_endpoint check (from_event_id is not null or from_anchor_id is not null),
  constraint timing_dependencies_to_endpoint check (to_event_id is not null or to_anchor_id is not null),
  constraint timing_dependencies_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint timing_dependencies_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.timing_dependencies is
'Timing relationships between events and anchors, such as SFX hit on a cut, captions avoiding overlays, or music ducking during speech.';

create table public.timing_conflicts (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  conflict_type public.story_timing_conflict_type not null,
  severity public.story_timing_conflict_severity not null default 'medium',
  related_event_ids uuid[] not null default '{}'::uuid[],
  related_anchor_ids uuid[] not null default '{}'::uuid[],
  source_systems public.story_timing_source_system[] not null default '{}'::public.story_timing_source_system[],
  start_time_seconds numeric,
  end_time_seconds numeric,
  description text not null,
  why_it_matters text,
  recommended_adjustment public.story_timing_adjustment_type,
  blocks_render boolean not null default false,
  requires_user_review boolean not null default false,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timing_conflicts_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint timing_conflicts_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint timing_conflicts_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint timing_conflicts_status_valid check (status in ('open', 'resolved', 'dismissed', 'waived', 'superseded')),
  constraint timing_conflicts_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.timing_conflicts is
'Detected timing conflicts, including captions colliding with overlays, SFX hits landing late, emotional pauses being removed, or Real Motion blocking faces.';
comment on column public.timing_conflicts.blocks_render is
'True when this timing issue should block preview/export readiness until resolved or waived.';

create table public.timing_conflict_resolutions (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  timing_conflict_id uuid not null references public.timing_conflicts(id) on delete cascade,
  adjustment_type public.story_timing_adjustment_type not null,
  affected_event_ids uuid[] not null default '{}'::uuid[],
  affected_anchor_ids uuid[] not null default '{}'::uuid[],
  time_shift_seconds numeric,
  new_start_time_seconds numeric,
  new_end_time_seconds numeric,
  reason text not null,
  approved boolean not null default false,
  approved_by_user_id uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timing_conflict_resolutions_new_start_nonnegative check (new_start_time_seconds is null or new_start_time_seconds >= 0),
  constraint timing_conflict_resolutions_new_end_nonnegative check (new_end_time_seconds is null or new_end_time_seconds >= 0),
  constraint timing_conflict_resolutions_new_range_valid check (
    new_start_time_seconds is null
    or new_end_time_seconds is null
    or new_end_time_seconds >= new_start_time_seconds
  ),
  constraint timing_conflict_resolutions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.timing_conflict_resolutions is
'Proposed or approved fixes for timing conflicts, such as shifting a reveal, shortening an SFX tail, adding ducking, or preserving an emotional pause.';

create table public.story_timing_qa_checks (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  story_timing_segment_id uuid references public.story_timing_segments(id) on delete set null,
  check_type public.story_timing_qa_check_type not null,
  status public.story_timing_qa_check_status not null default 'pending',
  score numeric,
  start_time_seconds numeric,
  end_time_seconds numeric,
  related_event_ids uuid[] not null default '{}'::uuid[],
  related_anchor_ids uuid[] not null default '{}'::uuid[],
  summary text not null,
  recommended_fix text,
  blocks_render boolean not null default false,
  requires_manual_review boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_timing_qa_checks_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint story_timing_qa_checks_start_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint story_timing_qa_checks_end_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint story_timing_qa_checks_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint story_timing_qa_checks_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.story_timing_qa_checks is
'Timing QA checks for captions, cuts, speech integrity, emotional pauses, music, SFX, transitions, signatures, platform pacing, and render manifest readiness.';

create table public.render_timing_manifests (
  id uuid primary key default gen_random_uuid(),
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  render_job_id uuid references public.render_jobs(id) on delete set null,
  status public.render_timing_manifest_status not null default 'draft',
  duration_seconds numeric,
  frame_rate numeric,
  tracks jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  conflicts_resolved boolean not null default false,
  resolved_conflict_ids uuid[] not null default '{}'::uuid[],
  ready_for_render boolean not null default false,
  worker_notes jsonb not null default '[]'::jsonb,
  manifest_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint render_timing_manifests_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint render_timing_manifests_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint render_timing_manifests_tracks_array check (jsonb_typeof(tracks) = 'array'),
  constraint render_timing_manifests_events_array check (jsonb_typeof(events) = 'array'),
  constraint render_timing_manifests_dependencies_array check (jsonb_typeof(dependencies) = 'array'),
  constraint render_timing_manifests_worker_notes_array check (jsonb_typeof(worker_notes) = 'array'),
  constraint render_timing_manifests_payload_object check (jsonb_typeof(manifest_payload) = 'object')
);

comment on table public.render_timing_manifests is
'Worker-ready timing manifests for composing cuts, captions, music, SFX, signature overlays, transitions, render markers, and QA markers.';
comment on column public.render_timing_manifests.ready_for_render is
'True only when the manifest is timing-safe enough for a future render worker to consume.';
comment on column public.render_timing_manifests.conflicts_resolved is
'Boolean summary that all blocking conflicts have been resolved or safely waived.';

create table public.render_timing_manifest_tracks (
  id uuid primary key default gen_random_uuid(),
  render_timing_manifest_id uuid not null references public.render_timing_manifests(id) on delete cascade,
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  track_type public.story_timing_track_type not null,
  label text not null,
  layer_order integer not null default 0,
  source_system public.story_timing_source_system not null default 'unknown',
  event_ids uuid[] not null default '{}'::uuid[],
  notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint render_timing_manifest_tracks_notes_array check (jsonb_typeof(notes) = 'array'),
  constraint render_timing_manifest_tracks_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.render_timing_manifest_tracks is
'Structured render manifest tracks for cuts, captions, music, SFX, signatures, QA markers, and manual timing layers.';

create table public.render_timing_manifest_events (
  id uuid primary key default gen_random_uuid(),
  render_timing_manifest_id uuid not null references public.render_timing_manifests(id) on delete cascade,
  master_timing_map_id uuid not null references public.master_timing_maps(id) on delete cascade,
  timing_event_id uuid references public.timing_events(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type public.story_timing_event_type not null,
  track_type public.story_timing_track_type not null,
  start_time_seconds numeric not null,
  hit_time_seconds numeric,
  end_time_seconds numeric not null,
  source_system public.story_timing_source_system not null default 'unknown',
  source_record_id uuid,
  source_table_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint render_timing_manifest_events_start_nonnegative check (start_time_seconds >= 0),
  constraint render_timing_manifest_events_hit_nonnegative check (hit_time_seconds is null or hit_time_seconds >= 0),
  constraint render_timing_manifest_events_range_valid check (end_time_seconds >= start_time_seconds),
  constraint render_timing_manifest_events_payload_object check (jsonb_typeof(payload) = 'object')
);

comment on table public.render_timing_manifest_events is
'Structured render manifest events copied or derived from StoryTiming events for future worker consumption.';

create index idx_master_timing_maps_workspace on public.master_timing_maps(workspace_id);
create index idx_master_timing_maps_project on public.master_timing_maps(project_id);
create index idx_master_timing_maps_chat_session on public.master_timing_maps(chat_session_id);
create index idx_master_timing_maps_edit_plan on public.master_timing_maps(edit_plan_id);
create index idx_master_timing_maps_status on public.master_timing_maps(status);
create index idx_master_timing_maps_primary_authority on public.master_timing_maps(primary_timing_authority);
create index idx_master_timing_maps_locked on public.master_timing_maps(locked_for_generation);
create index idx_master_timing_maps_approved_by on public.master_timing_maps(approved_by_user_id);
create index idx_master_timing_maps_approved_at on public.master_timing_maps(approved_at);
create index idx_master_timing_maps_created_at on public.master_timing_maps(created_at);
create index idx_master_timing_maps_timebase_gin on public.master_timing_maps using gin(timebase);

create index idx_story_timing_segments_map on public.story_timing_segments(master_timing_map_id);
create index idx_story_timing_segments_workspace on public.story_timing_segments(workspace_id);
create index idx_story_timing_segments_project on public.story_timing_segments(project_id);
create index idx_story_timing_segments_edit_plan on public.story_timing_segments(edit_plan_id);
create index idx_story_timing_segments_edit_segment on public.story_timing_segments(edit_plan_segment_id);
create index idx_story_timing_segments_story_beat on public.story_timing_segments(story_beat_id);
create index idx_story_timing_segments_order on public.story_timing_segments(segment_order);
create index idx_story_timing_segments_output_start on public.story_timing_segments(output_start_seconds);
create index idx_story_timing_segments_output_end on public.story_timing_segments(output_end_seconds);
create index idx_story_timing_segments_primary_authority on public.story_timing_segments(primary_authority);
create index idx_story_timing_segments_flags on public.story_timing_segments(has_speech, has_music, has_sfx, has_signature_overlay);

create index idx_timing_anchors_map on public.timing_anchors(master_timing_map_id);
create index idx_timing_anchors_workspace on public.timing_anchors(workspace_id);
create index idx_timing_anchors_project on public.timing_anchors(project_id);
create index idx_timing_anchors_edit_plan on public.timing_anchors(edit_plan_id);
create index idx_timing_anchors_segment on public.timing_anchors(story_timing_segment_id);
create index idx_timing_anchors_source_system on public.timing_anchors(source_system);
create index idx_timing_anchors_source_record on public.timing_anchors(source_record_id);
create index idx_timing_anchors_source_table on public.timing_anchors(source_table_name);
create index idx_timing_anchors_anchor_type on public.timing_anchors(anchor_type);
create index idx_timing_anchors_time on public.timing_anchors(time_seconds);
create index idx_timing_anchors_frame on public.timing_anchors(frame_number);
create index idx_timing_anchors_importance on public.timing_anchors(importance);
create index idx_timing_anchors_authority on public.timing_anchors(primary_authority);
create index idx_timing_anchors_sync_mode on public.timing_anchors(sync_mode);
create index idx_timing_anchors_locked on public.timing_anchors(locked);

create index idx_timing_events_map on public.timing_events(master_timing_map_id);
create index idx_timing_events_workspace on public.timing_events(workspace_id);
create index idx_timing_events_project on public.timing_events(project_id);
create index idx_timing_events_edit_plan on public.timing_events(edit_plan_id);
create index idx_timing_events_segment on public.timing_events(story_timing_segment_id);
create index idx_timing_events_anchor on public.timing_events(anchor_id);
create index idx_timing_events_source_system on public.timing_events(source_system);
create index idx_timing_events_source_record on public.timing_events(source_record_id);
create index idx_timing_events_source_table on public.timing_events(source_table_name);
create index idx_timing_events_event_type on public.timing_events(event_type);
create index idx_timing_events_track_type on public.timing_events(track_type);
create index idx_timing_events_start on public.timing_events(start_time_seconds);
create index idx_timing_events_hit on public.timing_events(hit_time_seconds);
create index idx_timing_events_end on public.timing_events(end_time_seconds);
create index idx_timing_events_frame_start on public.timing_events(frame_start);
create index idx_timing_events_frame_hit on public.timing_events(frame_hit);
create index idx_timing_events_priority on public.timing_events(priority);
create index idx_timing_events_sync_mode on public.timing_events(sync_mode);
create index idx_timing_events_shift_lock on public.timing_events(can_shift, locked);
create index idx_timing_events_visibility_layer on public.timing_events(visibility_layer);
create index idx_timing_events_audio_layer on public.timing_events(audio_layer);

create index idx_timing_dependencies_map on public.timing_dependencies(master_timing_map_id);
create index idx_timing_dependencies_workspace on public.timing_dependencies(workspace_id);
create index idx_timing_dependencies_project on public.timing_dependencies(project_id);
create index idx_timing_dependencies_edit_plan on public.timing_dependencies(edit_plan_id);
create index idx_timing_dependencies_from_event on public.timing_dependencies(from_event_id);
create index idx_timing_dependencies_to_event on public.timing_dependencies(to_event_id);
create index idx_timing_dependencies_from_anchor on public.timing_dependencies(from_anchor_id);
create index idx_timing_dependencies_to_anchor on public.timing_dependencies(to_anchor_id);
create index idx_timing_dependencies_type on public.timing_dependencies(dependency_type);
create index idx_timing_dependencies_required on public.timing_dependencies(required);

create index idx_timing_conflicts_map on public.timing_conflicts(master_timing_map_id);
create index idx_timing_conflicts_workspace on public.timing_conflicts(workspace_id);
create index idx_timing_conflicts_project on public.timing_conflicts(project_id);
create index idx_timing_conflicts_edit_plan on public.timing_conflicts(edit_plan_id);
create index idx_timing_conflicts_type on public.timing_conflicts(conflict_type);
create index idx_timing_conflicts_severity on public.timing_conflicts(severity);
create index idx_timing_conflicts_blocks_render on public.timing_conflicts(blocks_render);
create index idx_timing_conflicts_user_review on public.timing_conflicts(requires_user_review);
create index idx_timing_conflicts_status on public.timing_conflicts(status);
create index idx_timing_conflicts_start on public.timing_conflicts(start_time_seconds);
create index idx_timing_conflicts_end on public.timing_conflicts(end_time_seconds);

create index idx_timing_conflict_resolutions_map on public.timing_conflict_resolutions(master_timing_map_id);
create index idx_timing_conflict_resolutions_workspace on public.timing_conflict_resolutions(workspace_id);
create index idx_timing_conflict_resolutions_project on public.timing_conflict_resolutions(project_id);
create index idx_timing_conflict_resolutions_edit_plan on public.timing_conflict_resolutions(edit_plan_id);
create index idx_timing_conflict_resolutions_conflict on public.timing_conflict_resolutions(timing_conflict_id);
create index idx_timing_conflict_resolutions_adjustment on public.timing_conflict_resolutions(adjustment_type);
create index idx_timing_conflict_resolutions_approved on public.timing_conflict_resolutions(approved);
create index idx_timing_conflict_resolutions_approved_by on public.timing_conflict_resolutions(approved_by_user_id);
create index idx_timing_conflict_resolutions_approved_at on public.timing_conflict_resolutions(approved_at);

create index idx_story_timing_qa_checks_map on public.story_timing_qa_checks(master_timing_map_id);
create index idx_story_timing_qa_checks_workspace on public.story_timing_qa_checks(workspace_id);
create index idx_story_timing_qa_checks_project on public.story_timing_qa_checks(project_id);
create index idx_story_timing_qa_checks_edit_plan on public.story_timing_qa_checks(edit_plan_id);
create index idx_story_timing_qa_checks_segment on public.story_timing_qa_checks(story_timing_segment_id);
create index idx_story_timing_qa_checks_type on public.story_timing_qa_checks(check_type);
create index idx_story_timing_qa_checks_status on public.story_timing_qa_checks(status);
create index idx_story_timing_qa_checks_blocks_render on public.story_timing_qa_checks(blocks_render);
create index idx_story_timing_qa_checks_manual_review on public.story_timing_qa_checks(requires_manual_review);
create index idx_story_timing_qa_checks_score on public.story_timing_qa_checks(score);
create index idx_story_timing_qa_checks_start on public.story_timing_qa_checks(start_time_seconds);
create index idx_story_timing_qa_checks_end on public.story_timing_qa_checks(end_time_seconds);

create index idx_render_timing_manifests_map on public.render_timing_manifests(master_timing_map_id);
create index idx_render_timing_manifests_workspace on public.render_timing_manifests(workspace_id);
create index idx_render_timing_manifests_project on public.render_timing_manifests(project_id);
create index idx_render_timing_manifests_edit_plan on public.render_timing_manifests(edit_plan_id);
create index idx_render_timing_manifests_render_job on public.render_timing_manifests(render_job_id);
create index idx_render_timing_manifests_status on public.render_timing_manifests(status);
create index idx_render_timing_manifests_conflicts_resolved on public.render_timing_manifests(conflicts_resolved);
create index idx_render_timing_manifests_ready on public.render_timing_manifests(ready_for_render);
create index idx_render_timing_manifests_payload_gin on public.render_timing_manifests using gin(manifest_payload);

create index idx_render_timing_manifest_tracks_manifest on public.render_timing_manifest_tracks(render_timing_manifest_id);
create index idx_render_timing_manifest_tracks_map on public.render_timing_manifest_tracks(master_timing_map_id);
create index idx_render_timing_manifest_tracks_workspace on public.render_timing_manifest_tracks(workspace_id);
create index idx_render_timing_manifest_tracks_project on public.render_timing_manifest_tracks(project_id);
create index idx_render_timing_manifest_tracks_type on public.render_timing_manifest_tracks(track_type);
create index idx_render_timing_manifest_tracks_layer_order on public.render_timing_manifest_tracks(layer_order);
create index idx_render_timing_manifest_tracks_source_system on public.render_timing_manifest_tracks(source_system);

create index idx_render_timing_manifest_events_manifest on public.render_timing_manifest_events(render_timing_manifest_id);
create index idx_render_timing_manifest_events_map on public.render_timing_manifest_events(master_timing_map_id);
create index idx_render_timing_manifest_events_timing_event on public.render_timing_manifest_events(timing_event_id);
create index idx_render_timing_manifest_events_workspace on public.render_timing_manifest_events(workspace_id);
create index idx_render_timing_manifest_events_project on public.render_timing_manifest_events(project_id);
create index idx_render_timing_manifest_events_event_type on public.render_timing_manifest_events(event_type);
create index idx_render_timing_manifest_events_track_type on public.render_timing_manifest_events(track_type);
create index idx_render_timing_manifest_events_start on public.render_timing_manifest_events(start_time_seconds);
create index idx_render_timing_manifest_events_hit on public.render_timing_manifest_events(hit_time_seconds);
create index idx_render_timing_manifest_events_end on public.render_timing_manifest_events(end_time_seconds);
create index idx_render_timing_manifest_events_source_system on public.render_timing_manifest_events(source_system);
create index idx_render_timing_manifest_events_source_record on public.render_timing_manifest_events(source_record_id);

drop trigger if exists master_timing_maps_set_updated_at on public.master_timing_maps;
create trigger master_timing_maps_set_updated_at
before update on public.master_timing_maps
for each row execute function public.set_updated_at();

drop trigger if exists story_timing_segments_set_updated_at on public.story_timing_segments;
create trigger story_timing_segments_set_updated_at
before update on public.story_timing_segments
for each row execute function public.set_updated_at();

drop trigger if exists timing_anchors_set_updated_at on public.timing_anchors;
create trigger timing_anchors_set_updated_at
before update on public.timing_anchors
for each row execute function public.set_updated_at();

drop trigger if exists timing_events_set_updated_at on public.timing_events;
create trigger timing_events_set_updated_at
before update on public.timing_events
for each row execute function public.set_updated_at();

drop trigger if exists timing_dependencies_set_updated_at on public.timing_dependencies;
create trigger timing_dependencies_set_updated_at
before update on public.timing_dependencies
for each row execute function public.set_updated_at();

drop trigger if exists timing_conflicts_set_updated_at on public.timing_conflicts;
create trigger timing_conflicts_set_updated_at
before update on public.timing_conflicts
for each row execute function public.set_updated_at();

drop trigger if exists timing_conflict_resolutions_set_updated_at on public.timing_conflict_resolutions;
create trigger timing_conflict_resolutions_set_updated_at
before update on public.timing_conflict_resolutions
for each row execute function public.set_updated_at();

drop trigger if exists story_timing_qa_checks_set_updated_at on public.story_timing_qa_checks;
create trigger story_timing_qa_checks_set_updated_at
before update on public.story_timing_qa_checks
for each row execute function public.set_updated_at();

drop trigger if exists render_timing_manifests_set_updated_at on public.render_timing_manifests;
create trigger render_timing_manifests_set_updated_at
before update on public.render_timing_manifests
for each row execute function public.set_updated_at();

drop trigger if exists render_timing_manifest_tracks_set_updated_at on public.render_timing_manifest_tracks;
create trigger render_timing_manifest_tracks_set_updated_at
before update on public.render_timing_manifest_tracks
for each row execute function public.set_updated_at();

create or replace view public.project_latest_timing_map_view as
select distinct on (project_id, edit_plan_id)
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  chat_session_id,
  version,
  status,
  duration_seconds,
  frame_rate,
  primary_timing_authority,
  locked_for_generation,
  approved_at,
  created_at,
  updated_at
from public.master_timing_maps
order by project_id, edit_plan_id, version desc, created_at desc;

create or replace view public.timing_conflicts_open_view as
select
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  master_timing_map_id,
  conflict_type,
  severity,
  start_time_seconds,
  end_time_seconds,
  description,
  blocks_render,
  requires_user_review,
  status,
  created_at,
  updated_at
from public.timing_conflicts
where status = 'open'
  and (blocks_render or requires_user_review);

create or replace view public.render_ready_timing_maps_view as
select
  mtm.id as master_timing_map_id,
  mtm.workspace_id,
  mtm.project_id,
  mtm.edit_plan_id,
  mtm.version,
  mtm.status as timing_map_status,
  rtm.id as render_timing_manifest_id,
  rtm.status as render_timing_manifest_status,
  rtm.ready_for_render,
  rtm.conflicts_resolved,
  rtm.render_job_id,
  rtm.updated_at as manifest_updated_at
from public.master_timing_maps mtm
join public.render_timing_manifests rtm
  on rtm.master_timing_map_id = mtm.id
where mtm.status in ('approved', 'locked_for_generation', 'render_ready')
  and rtm.ready_for_render = true
  and rtm.conflicts_resolved = true;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'master_timing_maps',
    'story_timing_segments',
    'timing_anchors',
    'timing_events',
    'timing_dependencies',
    'timing_conflicts',
    'timing_conflict_resolutions',
    'story_timing_qa_checks',
    'render_timing_manifests',
    'render_timing_manifest_tracks',
    'render_timing_manifest_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon', table_name);
    execute format('grant select, insert, update on table public.%I to authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (workspace_id is not null and public.is_workspace_member(workspace_id))',
      table_name || '_select_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (workspace_id is not null and public.has_workspace_role(workspace_id, array[''owner'', ''admin'', ''editor'']::public.workspace_role[]))',
      table_name || '_insert_editor',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (workspace_id is not null and public.has_workspace_role(workspace_id, array[''owner'', ''admin'', ''editor'']::public.workspace_role[])) with check (workspace_id is not null and public.has_workspace_role(workspace_id, array[''owner'', ''admin'', ''editor'']::public.workspace_role[]))',
      table_name || '_update_editor',
      table_name
    );
  end loop;
end $$;

revoke all on table public.project_latest_timing_map_view from public, anon;
revoke all on table public.timing_conflicts_open_view from public, anon;
revoke all on table public.render_ready_timing_maps_view from public, anon;
grant select on table public.project_latest_timing_map_view to authenticated, service_role;
grant select on table public.timing_conflicts_open_view to authenticated, service_role;
grant select on table public.render_ready_timing_maps_view to authenticated, service_role;
