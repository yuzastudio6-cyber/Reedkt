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
  create type public.stroke_motion_understanding_mode as enum (
    'spoken_story_mode',
    'source_reading_mode'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_source_text_type as enum (
    'spoken_story',
    'scripture',
    'book_passage',
    'quote',
    'script',
    'historical_text',
    'document',
    'lesson',
    'article',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_plan_status as enum (
    'draft',
    'planning',
    'awaiting_user_input',
    'awaiting_approval',
    'approved',
    'ready_for_generation',
    'generating',
    'generated',
    'preview_ready',
    'revision_requested',
    'completed',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_style_level as enum (
    'minimal',
    'balanced',
    'expressive',
    'cinematic',
    'faith_respectful',
    'educational_clear',
    'playful',
    'premium_subtle'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_character_role as enum (
    'main_subject',
    'secondary_subject',
    'speaker_proxy',
    'symbolic_person',
    'group',
    'messenger',
    'object_proxy',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_symbol_type as enum (
    'question_mark',
    'heart',
    'ring',
    'connection_line',
    'broken_line',
    'path',
    'light',
    'glow',
    'star',
    'message',
    'scroll',
    'door',
    'shield',
    'circle',
    'underline',
    'arrow',
    'warning',
    'success',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_transition_type as enum (
    'draw_on',
    'morph',
    'path_follow',
    'line_to_glow',
    'line_to_crack',
    'crack_to_path',
    'path_to_light',
    'light_to_connection',
    'connection_to_circle',
    'fade_out',
    'wipe_out',
    'match_motion',
    'none',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_timing_anchor_type as enum (
    'word',
    'phrase',
    'sentence',
    'pause',
    'emotional_shift',
    'scene_cut',
    'music_beat',
    'sfx_hit',
    'manual'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_generation_status as enum (
    'not_started',
    'planned',
    'awaiting_approval',
    'queued',
    'generating',
    'generated',
    'failed',
    'cancelled',
    'revision_requested'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_output_format as enum (
    'svg',
    'lottie',
    'remotion',
    'transparent_video',
    'image_sequence',
    'json_spec',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stroke_motion_sfx_hint as enum (
    'none',
    'soft_draw',
    'light_whoosh',
    'gentle_hit',
    'soft_rise',
    'subtle_crack',
    'message_chime',
    'ambient_soft',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

create table public.stroke_motion_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  signature_route_id uuid references public.signature_routes(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  credit_estimate_id uuid references public.credit_estimates(id) on delete set null,
  status public.stroke_motion_plan_status not null default 'draft',
  understanding_mode public.stroke_motion_understanding_mode not null,
  source_text_type public.stroke_motion_source_text_type not null default 'unknown',
  source_reference text,
  source_excerpt text,
  spoken_transcript_excerpt text,
  story_summary text not null,
  meaning_expansion_summary text,
  animation_goal text not null,
  style_level public.stroke_motion_style_level not null default 'balanced',
  transition_strategy text,
  timing_strategy text,
  continuous_line_strategy boolean not null default true,
  transparent_overlay_required boolean not null default true,
  approval_required boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references public.user_profiles(id) on delete set null,
  generation_status public.stroke_motion_generation_status not null default 'not_started',
  worker_notes text,
  must_follow_rules jsonb not null default '[]'::jsonb,
  avoid_rules jsonb not null default '[]'::jsonb,
  plan_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_plans_must_follow_rules_array check (jsonb_typeof(must_follow_rules) = 'array'),
  constraint stroke_motion_plans_avoid_rules_array check (jsonb_typeof(avoid_rules) = 'array'),
  constraint stroke_motion_plans_source_reading_has_expansion check (
    understanding_mode <> 'source_reading_mode'
    or meaning_expansion_summary is not null
    or coalesce(jsonb_typeof(plan_payload -> 'meaning_expansion') in ('array', 'object'), false)
  )
);

comment on table public.stroke_motion_plans is
'Plans a fast transparent 2D animated story layer. Stroke Motion turns spoken meaning or source readings into visual story beats before animation generation.';
comment on column public.stroke_motion_plans.understanding_mode is
'Determines whether the plan is extracted from a spoken explanation or from source reading that needs meaning expansion first.';
comment on column public.stroke_motion_plans.meaning_expansion_summary is
'Plain-language expansion of source readings before animation planning. Required in source reading mode unless stored in plan_payload.';
comment on column public.stroke_motion_plans.story_summary is
'Human-readable meaning summary. Stroke Motion must be understandable visually, even without words or captions.';
comment on column public.stroke_motion_plans.generation_status is
'Planning-side generation readiness state only. This migration does not start animation generation.';

create table public.stroke_motion_meaning_expansions (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_text_type public.stroke_motion_source_text_type not null default 'unknown',
  source_reference text,
  source_excerpt text,
  plain_language_summary text not null,
  expanded_story_beats jsonb not null default '[]'::jsonb,
  interpretation_notes text,
  confidence public.planning_confidence not null default 'medium',
  requires_user_confirmation boolean not null default false,
  must_follow_rules jsonb not null default '[]'::jsonb,
  avoid_rules jsonb not null default '[]'::jsonb,
  created_by_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_meaning_expansions_story_beats_array check (jsonb_typeof(expanded_story_beats) = 'array'),
  constraint stroke_motion_meaning_expansions_must_follow_rules_array check (jsonb_typeof(must_follow_rules) = 'array'),
  constraint stroke_motion_meaning_expansions_avoid_rules_array check (jsonb_typeof(avoid_rules) = 'array')
);

comment on table public.stroke_motion_meaning_expansions is
'Meaning expansion turns source readings into clear visual story beats before Stroke Motion animation planning.';
comment on column public.stroke_motion_meaning_expansions.expanded_story_beats is
'Ordered plain-language beats inferred from a source text. These are interpretation/planning records, not generated animation.';

create table public.stroke_motion_beats (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete set null,
  story_beat_id uuid references public.story_beats(id) on delete set null,
  beat_order integer not null,
  story_beat_label text not null,
  meaning text not null,
  visual_action text not null,
  motion_path text,
  transition_in text,
  transition_out text,
  start_time_seconds numeric,
  end_time_seconds numeric,
  matched_words text,
  timing_anchor_label text,
  sfx_hint public.stroke_motion_sfx_hint not null default 'none',
  credit_impact text not null default 'medium',
  worker_notes text,
  must_follow_rules jsonb not null default '[]'::jsonb,
  avoid_rules jsonb not null default '[]'::jsonb,
  beat_payload jsonb not null default '{}'::jsonb,
  render_status public.stroke_motion_generation_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_beats_order_positive check (beat_order > 0),
  constraint stroke_motion_beats_start_time_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint stroke_motion_beats_end_time_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint stroke_motion_beats_time_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint stroke_motion_beats_credit_impact_check check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  constraint stroke_motion_beats_must_follow_rules_array check (jsonb_typeof(must_follow_rules) = 'array'),
  constraint stroke_motion_beats_avoid_rules_array check (jsonb_typeof(avoid_rules) = 'array'),
  unique (stroke_motion_plan_id, beat_order)
);

comment on table public.stroke_motion_beats is
'Ordered visual story beats for a Stroke Motion plan.';
comment on column public.stroke_motion_beats.meaning is
'The story meaning this beat must communicate visually.';
comment on column public.stroke_motion_beats.visual_action is
'The planned stroke character, symbol, path, or transition action that communicates the beat meaning.';

create table public.stroke_motion_characters (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  character_key text not null,
  display_name text,
  role public.stroke_motion_character_role not null default 'unknown',
  description text,
  visual_style text,
  emotion_state text,
  is_symbolic boolean not null default false,
  character_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stroke_motion_plan_id, character_key)
);

comment on table public.stroke_motion_characters is
'Stroke figures or symbolic people/objects used by a Stroke Motion plan.';
comment on column public.stroke_motion_characters.role is
'Planning role for a character, such as main subject, speaker proxy, messenger, group, or symbolic object.';

create table public.stroke_motion_symbols (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  symbol_key text not null,
  symbol_type public.stroke_motion_symbol_type not null default 'custom',
  label text,
  meaning text not null,
  visual_style text,
  usage_notes text,
  symbol_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stroke_motion_plan_id, symbol_key)
);

comment on table public.stroke_motion_symbols is
'Symbols, icons, visual marks, and paths used to communicate Stroke Motion meaning.';
comment on column public.stroke_motion_symbols.meaning is
'The semantic meaning of the symbol in the plan. Symbols should not be random decoration.';

create table public.stroke_motion_beat_characters (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_beat_id uuid not null references public.stroke_motion_beats(id) on delete cascade,
  stroke_motion_character_id uuid not null references public.stroke_motion_characters(id) on delete cascade,
  role_in_beat text,
  action_in_beat text,
  created_at timestamptz not null default now(),
  unique (stroke_motion_beat_id, stroke_motion_character_id)
);

comment on table public.stroke_motion_beat_characters is
'Join table linking Stroke Motion beats to characters and their actions in each beat.';

create table public.stroke_motion_beat_symbols (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_beat_id uuid not null references public.stroke_motion_beats(id) on delete cascade,
  stroke_motion_symbol_id uuid not null references public.stroke_motion_symbols(id) on delete cascade,
  role_in_beat text,
  action_in_beat text,
  created_at timestamptz not null default now(),
  unique (stroke_motion_beat_id, stroke_motion_symbol_id)
);

comment on table public.stroke_motion_beat_symbols is
'Join table linking Stroke Motion beats to symbols and the role each symbol plays in the beat.';

create table public.stroke_motion_transitions (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  from_beat_id uuid references public.stroke_motion_beats(id) on delete cascade,
  to_beat_id uuid references public.stroke_motion_beats(id) on delete cascade,
  transition_order integer not null,
  transition_type public.stroke_motion_transition_type not null default 'morph',
  transition_description text not null,
  motion_path text,
  duration_seconds numeric,
  timing_notes text,
  sfx_hint public.stroke_motion_sfx_hint not null default 'none',
  worker_notes text,
  transition_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_transitions_order_positive check (transition_order > 0),
  constraint stroke_motion_transitions_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0)
);

comment on table public.stroke_motion_transitions is
'Connected transformations between Stroke Motion beats. Transitions should make one continuous animated story, not random icons.';
comment on column public.stroke_motion_transitions.transition_type is
'How one beat transforms into another, such as draw_on, morph, path_follow, line_to_crack, or connection_to_circle.';

create table public.stroke_motion_timing_anchors (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  stroke_motion_beat_id uuid references public.stroke_motion_beats(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  anchor_type public.stroke_motion_timing_anchor_type not null,
  anchor_label text,
  matched_text text,
  start_time_seconds numeric,
  end_time_seconds numeric,
  word_index_start integer,
  word_index_end integer,
  music_beat_reference text,
  manual_note text,
  confidence public.planning_confidence not null default 'medium',
  anchor_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_timing_anchors_start_time_nonnegative check (start_time_seconds is null or start_time_seconds >= 0),
  constraint stroke_motion_timing_anchors_end_time_nonnegative check (end_time_seconds is null or end_time_seconds >= 0),
  constraint stroke_motion_timing_anchors_time_range_valid check (
    start_time_seconds is null
    or end_time_seconds is null
    or end_time_seconds >= start_time_seconds
  ),
  constraint stroke_motion_timing_anchors_word_start_nonnegative check (word_index_start is null or word_index_start >= 0),
  constraint stroke_motion_timing_anchors_word_end_nonnegative check (word_index_end is null or word_index_end >= 0),
  constraint stroke_motion_timing_anchors_word_range_valid check (
    word_index_start is null
    or word_index_end is null
    or word_index_end >= word_index_start
  )
);

comment on table public.stroke_motion_timing_anchors is
'Word, phrase, sentence, pause, emotional shift, scene cut, music beat, SFX, or manual timing anchors for Stroke Motion.';
comment on column public.stroke_motion_timing_anchors.anchor_type is
'Timing anchor category used to synchronize motion to meaning, words, pauses, emotional shifts, and story beats.';

create table public.stroke_motion_storyboard_frames (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  stroke_motion_beat_id uuid references public.stroke_motion_beats(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  frame_order integer not null,
  title text not null,
  description text not null,
  visual_composition text,
  camera_or_overlay_position text,
  expected_viewer_understanding text,
  frame_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_storyboard_frames_order_positive check (frame_order > 0),
  unique (stroke_motion_plan_id, frame_order)
);

comment on table public.stroke_motion_storyboard_frames is
'Simple storyboard frames that prove the Stroke Motion story is understandable before expensive animation generation.';
comment on column public.stroke_motion_storyboard_frames.expected_viewer_understanding is
'What a viewer should understand visually from the frame, even without audio or captions.';

create table public.stroke_motion_generation_specs (
  id uuid primary key default gen_random_uuid(),
  stroke_motion_plan_id uuid not null references public.stroke_motion_plans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  preferred_output_format public.stroke_motion_output_format not null default 'json_spec',
  transparent_background_required boolean not null default true,
  word_level_timing_required boolean not null default true,
  deterministic_renderer_preferred boolean not null default true,
  suggested_renderer text,
  suggested_ai_provider text,
  duration_seconds numeric,
  width integer,
  height integer,
  frame_rate numeric,
  style_constraints jsonb not null default '{}'::jsonb,
  timing_constraints jsonb not null default '{}'::jsonb,
  prompt text,
  negative_prompt text,
  worker_notes text,
  generation_request_id uuid null,
  spec_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stroke_motion_generation_specs_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint stroke_motion_generation_specs_width_positive check (width is null or width > 0),
  constraint stroke_motion_generation_specs_height_positive check (height is null or height > 0),
  constraint stroke_motion_generation_specs_frame_rate_positive check (frame_rate is null or frame_rate > 0),
  constraint stroke_motion_generation_specs_style_constraints_object check (jsonb_typeof(style_constraints) = 'object'),
  constraint stroke_motion_generation_specs_timing_constraints_object check (jsonb_typeof(timing_constraints) = 'object')
);

comment on table public.stroke_motion_generation_specs is
'Stroke Motion-specific future generation requirements. This is not a generation request table and does not call providers.';
comment on column public.stroke_motion_generation_specs.deterministic_renderer_preferred is
'Stroke Motion should prefer controlled animation/rendering systems such as SVG, Lottie, Remotion, or custom deterministic renderers when word-level timing and transparent overlays are required.';
comment on column public.stroke_motion_generation_specs.generation_request_id is
'Placeholder ID for a future generation request table. No foreign key is added in RP-DB-08 because generation request tables come later.';

create table public.stroke_motion_plan_examples (
  id uuid primary key default gen_random_uuid(),
  example_key text not null unique,
  title text not null,
  description text,
  use_case text,
  understanding_mode public.stroke_motion_understanding_mode,
  source_text_type public.stroke_motion_source_text_type,
  story_pattern text,
  example_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.stroke_motion_plan_examples is
'Reusable Stroke Motion planning examples and templates. Examples are reference patterns only and must not hard-code Stroke Motion to one topic or source type.';
comment on column public.stroke_motion_plan_examples.example_payload is
'Example-only planning payload. The Joseph/Mary record demonstrates source reading mode, but Stroke Motion applies broadly beyond Bible content.';

insert into public.stroke_motion_plan_examples (
  example_key,
  title,
  description,
  use_case,
  understanding_mode,
  source_text_type,
  story_pattern,
  example_payload
)
values (
  'joseph_mary_source_reading_example',
  'Joseph and Mary source reading example',
  'Example-only Stroke Motion source reading plan showing relationship, misunderstanding, message, restored connection, and protection.',
  'Source reading mode example for scripture, books, lessons, historical text, documents, or other source material that needs meaning expansion before animation planning.',
  'source_reading_mode',
  'scripture',
  'misunderstanding_to_reassurance_to_restored_connection',
  '{
    "example_only": true,
    "not_bible_only": true,
    "source_reference": "Matthew 1:18-25",
    "meaning_expansion": [
      "Joseph and Mary are connected/engaged.",
      "Mary is found pregnant by the Holy Spirit.",
      "Joseph is confused and does not fully understand.",
      "Joseph plans quiet separation.",
      "An angel/message appears in a dream.",
      "Joseph understands the child is from God.",
      "Joseph accepts Mary.",
      "A protective circle/restored connection closes the story."
    ],
    "transition_chain": [
      "relationship line",
      "holy glow",
      "tension/crack",
      "separation path",
      "divine message line",
      "repaired connection",
      "protective circle",
      "fade/underline transition out"
    ],
    "worker_notes": [
      "Do not make Mary look guilty.",
      "Show Josephs misunderstanding respectfully.",
      "Keep divine presence symbolic, not literal.",
      "Use one continuous stroke line if possible.",
      "Make the animation understandable without words.",
      "Keep it fast and timed to the speaker."
    ]
  }'::jsonb
)
on conflict (example_key) do update
set
  title = excluded.title,
  description = excluded.description,
  use_case = excluded.use_case,
  understanding_mode = excluded.understanding_mode,
  source_text_type = excluded.source_text_type,
  story_pattern = excluded.story_pattern,
  example_payload = excluded.example_payload,
  is_active = true,
  updated_at = now();

create index stroke_motion_plans_workspace_id_idx on public.stroke_motion_plans (workspace_id);
create index stroke_motion_plans_project_id_idx on public.stroke_motion_plans (project_id);
create index stroke_motion_plans_chat_session_id_idx on public.stroke_motion_plans (chat_session_id);
create index stroke_motion_plans_chat_message_id_idx on public.stroke_motion_plans (chat_message_id);
create index stroke_motion_plans_edit_plan_id_idx on public.stroke_motion_plans (edit_plan_id);
create index stroke_motion_plans_edit_plan_segment_id_idx on public.stroke_motion_plans (edit_plan_segment_id);
create index stroke_motion_plans_signature_route_id_idx on public.stroke_motion_plans (signature_route_id);
create index stroke_motion_plans_job_id_idx on public.stroke_motion_plans (job_id);
create index stroke_motion_plans_agent_run_id_idx on public.stroke_motion_plans (agent_run_id);
create index stroke_motion_plans_credit_estimate_id_idx on public.stroke_motion_plans (credit_estimate_id);
create index stroke_motion_plans_status_idx on public.stroke_motion_plans (status);
create index stroke_motion_plans_understanding_mode_idx on public.stroke_motion_plans (understanding_mode);
create index stroke_motion_plans_source_text_type_idx on public.stroke_motion_plans (source_text_type);
create index stroke_motion_plans_style_level_idx on public.stroke_motion_plans (style_level);
create index stroke_motion_plans_generation_status_idx on public.stroke_motion_plans (generation_status);
create index stroke_motion_plans_approved_at_idx on public.stroke_motion_plans (approved_at);

create index stroke_motion_meaning_expansions_plan_id_idx on public.stroke_motion_meaning_expansions (stroke_motion_plan_id);
create index stroke_motion_meaning_expansions_workspace_id_idx on public.stroke_motion_meaning_expansions (workspace_id);
create index stroke_motion_meaning_expansions_project_id_idx on public.stroke_motion_meaning_expansions (project_id);
create index stroke_motion_meaning_expansions_source_text_type_idx on public.stroke_motion_meaning_expansions (source_text_type);
create index stroke_motion_meaning_expansions_source_reference_idx on public.stroke_motion_meaning_expansions (source_reference);
create index stroke_motion_meaning_expansions_confidence_idx on public.stroke_motion_meaning_expansions (confidence);
create index stroke_motion_meaning_expansions_requires_confirmation_idx on public.stroke_motion_meaning_expansions (requires_user_confirmation);

create index stroke_motion_beats_plan_id_idx on public.stroke_motion_beats (stroke_motion_plan_id);
create index stroke_motion_beats_workspace_id_idx on public.stroke_motion_beats (workspace_id);
create index stroke_motion_beats_project_id_idx on public.stroke_motion_beats (project_id);
create index stroke_motion_beats_edit_plan_segment_id_idx on public.stroke_motion_beats (edit_plan_segment_id);
create index stroke_motion_beats_story_beat_id_idx on public.stroke_motion_beats (story_beat_id);
create index stroke_motion_beats_beat_order_idx on public.stroke_motion_beats (beat_order);
create index stroke_motion_beats_render_status_idx on public.stroke_motion_beats (render_status);
create index stroke_motion_beats_sfx_hint_idx on public.stroke_motion_beats (sfx_hint);

create index stroke_motion_characters_plan_id_idx on public.stroke_motion_characters (stroke_motion_plan_id);
create index stroke_motion_characters_workspace_id_idx on public.stroke_motion_characters (workspace_id);
create index stroke_motion_characters_project_id_idx on public.stroke_motion_characters (project_id);
create index stroke_motion_characters_role_idx on public.stroke_motion_characters (role);
create index stroke_motion_characters_is_symbolic_idx on public.stroke_motion_characters (is_symbolic);

create index stroke_motion_symbols_plan_id_idx on public.stroke_motion_symbols (stroke_motion_plan_id);
create index stroke_motion_symbols_workspace_id_idx on public.stroke_motion_symbols (workspace_id);
create index stroke_motion_symbols_project_id_idx on public.stroke_motion_symbols (project_id);
create index stroke_motion_symbols_symbol_type_idx on public.stroke_motion_symbols (symbol_type);

create index stroke_motion_beat_characters_beat_id_idx on public.stroke_motion_beat_characters (stroke_motion_beat_id);
create index stroke_motion_beat_characters_character_id_idx on public.stroke_motion_beat_characters (stroke_motion_character_id);

create index stroke_motion_beat_symbols_beat_id_idx on public.stroke_motion_beat_symbols (stroke_motion_beat_id);
create index stroke_motion_beat_symbols_symbol_id_idx on public.stroke_motion_beat_symbols (stroke_motion_symbol_id);

create index stroke_motion_transitions_plan_id_idx on public.stroke_motion_transitions (stroke_motion_plan_id);
create index stroke_motion_transitions_workspace_id_idx on public.stroke_motion_transitions (workspace_id);
create index stroke_motion_transitions_project_id_idx on public.stroke_motion_transitions (project_id);
create index stroke_motion_transitions_from_beat_id_idx on public.stroke_motion_transitions (from_beat_id);
create index stroke_motion_transitions_to_beat_id_idx on public.stroke_motion_transitions (to_beat_id);
create index stroke_motion_transitions_order_idx on public.stroke_motion_transitions (transition_order);
create index stroke_motion_transitions_type_idx on public.stroke_motion_transitions (transition_type);
create index stroke_motion_transitions_sfx_hint_idx on public.stroke_motion_transitions (sfx_hint);

create index stroke_motion_timing_anchors_plan_id_idx on public.stroke_motion_timing_anchors (stroke_motion_plan_id);
create index stroke_motion_timing_anchors_beat_id_idx on public.stroke_motion_timing_anchors (stroke_motion_beat_id);
create index stroke_motion_timing_anchors_workspace_id_idx on public.stroke_motion_timing_anchors (workspace_id);
create index stroke_motion_timing_anchors_project_id_idx on public.stroke_motion_timing_anchors (project_id);
create index stroke_motion_timing_anchors_anchor_type_idx on public.stroke_motion_timing_anchors (anchor_type);
create index stroke_motion_timing_anchors_start_time_idx on public.stroke_motion_timing_anchors (start_time_seconds);
create index stroke_motion_timing_anchors_confidence_idx on public.stroke_motion_timing_anchors (confidence);

create index stroke_motion_storyboard_frames_plan_id_idx on public.stroke_motion_storyboard_frames (stroke_motion_plan_id);
create index stroke_motion_storyboard_frames_beat_id_idx on public.stroke_motion_storyboard_frames (stroke_motion_beat_id);
create index stroke_motion_storyboard_frames_workspace_id_idx on public.stroke_motion_storyboard_frames (workspace_id);
create index stroke_motion_storyboard_frames_project_id_idx on public.stroke_motion_storyboard_frames (project_id);
create index stroke_motion_storyboard_frames_order_idx on public.stroke_motion_storyboard_frames (frame_order);

create index stroke_motion_generation_specs_plan_id_idx on public.stroke_motion_generation_specs (stroke_motion_plan_id);
create index stroke_motion_generation_specs_workspace_id_idx on public.stroke_motion_generation_specs (workspace_id);
create index stroke_motion_generation_specs_project_id_idx on public.stroke_motion_generation_specs (project_id);
create index stroke_motion_generation_specs_output_format_idx on public.stroke_motion_generation_specs (preferred_output_format);
create index stroke_motion_generation_specs_suggested_renderer_idx on public.stroke_motion_generation_specs (suggested_renderer);
create index stroke_motion_generation_specs_suggested_ai_provider_idx on public.stroke_motion_generation_specs (suggested_ai_provider);
create index stroke_motion_generation_specs_generation_request_id_idx on public.stroke_motion_generation_specs (generation_request_id);

create index stroke_motion_plan_examples_example_key_idx on public.stroke_motion_plan_examples (example_key);
create index stroke_motion_plan_examples_understanding_mode_idx on public.stroke_motion_plan_examples (understanding_mode);
create index stroke_motion_plan_examples_source_text_type_idx on public.stroke_motion_plan_examples (source_text_type);
create index stroke_motion_plan_examples_is_active_idx on public.stroke_motion_plan_examples (is_active);

create trigger stroke_motion_plans_set_updated_at
before update on public.stroke_motion_plans
for each row execute function public.set_updated_at();

create trigger stroke_motion_meaning_expansions_set_updated_at
before update on public.stroke_motion_meaning_expansions
for each row execute function public.set_updated_at();

create trigger stroke_motion_beats_set_updated_at
before update on public.stroke_motion_beats
for each row execute function public.set_updated_at();

create trigger stroke_motion_characters_set_updated_at
before update on public.stroke_motion_characters
for each row execute function public.set_updated_at();

create trigger stroke_motion_symbols_set_updated_at
before update on public.stroke_motion_symbols
for each row execute function public.set_updated_at();

create trigger stroke_motion_transitions_set_updated_at
before update on public.stroke_motion_transitions
for each row execute function public.set_updated_at();

create trigger stroke_motion_timing_anchors_set_updated_at
before update on public.stroke_motion_timing_anchors
for each row execute function public.set_updated_at();

create trigger stroke_motion_storyboard_frames_set_updated_at
before update on public.stroke_motion_storyboard_frames
for each row execute function public.set_updated_at();

create trigger stroke_motion_generation_specs_set_updated_at
before update on public.stroke_motion_generation_specs
for each row execute function public.set_updated_at();

create trigger stroke_motion_plan_examples_set_updated_at
before update on public.stroke_motion_plan_examples
for each row execute function public.set_updated_at();

alter table public.stroke_motion_plans enable row level security;
alter table public.stroke_motion_meaning_expansions enable row level security;
alter table public.stroke_motion_beats enable row level security;
alter table public.stroke_motion_characters enable row level security;
alter table public.stroke_motion_symbols enable row level security;
alter table public.stroke_motion_beat_characters enable row level security;
alter table public.stroke_motion_beat_symbols enable row level security;
alter table public.stroke_motion_transitions enable row level security;
alter table public.stroke_motion_timing_anchors enable row level security;
alter table public.stroke_motion_storyboard_frames enable row level security;
alter table public.stroke_motion_generation_specs enable row level security;
alter table public.stroke_motion_plan_examples enable row level security;

create policy stroke_motion_plans_select_member
on public.stroke_motion_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_plans_insert_editor
on public.stroke_motion_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_plans_update_editor
on public.stroke_motion_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_meaning_expansions_select_member
on public.stroke_motion_meaning_expansions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_meaning_expansions_insert_editor
on public.stroke_motion_meaning_expansions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_meaning_expansions_update_editor
on public.stroke_motion_meaning_expansions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_beats_select_member
on public.stroke_motion_beats for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_beats_insert_editor
on public.stroke_motion_beats for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_beats_update_editor
on public.stroke_motion_beats for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_characters_select_member
on public.stroke_motion_characters for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_characters_insert_editor
on public.stroke_motion_characters for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_characters_update_editor
on public.stroke_motion_characters for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_symbols_select_member
on public.stroke_motion_symbols for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_symbols_insert_editor
on public.stroke_motion_symbols for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_symbols_update_editor
on public.stroke_motion_symbols for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_beat_characters_select_member
on public.stroke_motion_beat_characters for select
to authenticated
using (
  exists (
    select 1
    from public.stroke_motion_beats b
    where b.id = stroke_motion_beat_id
      and public.is_workspace_member(b.workspace_id)
  )
);

create policy stroke_motion_beat_characters_insert_editor
on public.stroke_motion_beat_characters for insert
to authenticated
with check (
  exists (
    select 1
    from public.stroke_motion_beats b
    join public.stroke_motion_characters c
      on c.id = stroke_motion_character_id
      and c.stroke_motion_plan_id = b.stroke_motion_plan_id
    where b.id = stroke_motion_beat_id
      and public.has_workspace_role(b.workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
  )
);

create policy stroke_motion_beat_characters_delete_editor
on public.stroke_motion_beat_characters for delete
to authenticated
using (
  exists (
    select 1
    from public.stroke_motion_beats b
    where b.id = stroke_motion_beat_id
      and public.has_workspace_role(b.workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
  )
);

create policy stroke_motion_beat_symbols_select_member
on public.stroke_motion_beat_symbols for select
to authenticated
using (
  exists (
    select 1
    from public.stroke_motion_beats b
    where b.id = stroke_motion_beat_id
      and public.is_workspace_member(b.workspace_id)
  )
);

create policy stroke_motion_beat_symbols_insert_editor
on public.stroke_motion_beat_symbols for insert
to authenticated
with check (
  exists (
    select 1
    from public.stroke_motion_beats b
    join public.stroke_motion_symbols s
      on s.id = stroke_motion_symbol_id
      and s.stroke_motion_plan_id = b.stroke_motion_plan_id
    where b.id = stroke_motion_beat_id
      and public.has_workspace_role(b.workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
  )
);

create policy stroke_motion_beat_symbols_delete_editor
on public.stroke_motion_beat_symbols for delete
to authenticated
using (
  exists (
    select 1
    from public.stroke_motion_beats b
    where b.id = stroke_motion_beat_id
      and public.has_workspace_role(b.workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[])
  )
);

create policy stroke_motion_transitions_select_member
on public.stroke_motion_transitions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_transitions_insert_editor
on public.stroke_motion_transitions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_transitions_update_editor
on public.stroke_motion_transitions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_timing_anchors_select_member
on public.stroke_motion_timing_anchors for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_timing_anchors_insert_editor
on public.stroke_motion_timing_anchors for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_timing_anchors_update_editor
on public.stroke_motion_timing_anchors for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_storyboard_frames_select_member
on public.stroke_motion_storyboard_frames for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_storyboard_frames_insert_editor
on public.stroke_motion_storyboard_frames for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_storyboard_frames_update_editor
on public.stroke_motion_storyboard_frames for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_generation_specs_select_member
on public.stroke_motion_generation_specs for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy stroke_motion_generation_specs_insert_editor
on public.stroke_motion_generation_specs for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_generation_specs_update_editor
on public.stroke_motion_generation_specs for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy stroke_motion_plan_examples_select_active
on public.stroke_motion_plan_examples for select
to authenticated
using (is_active);

grant usage on type public.stroke_motion_understanding_mode to authenticated, service_role;
grant usage on type public.stroke_motion_source_text_type to authenticated, service_role;
grant usage on type public.stroke_motion_plan_status to authenticated, service_role;
grant usage on type public.stroke_motion_style_level to authenticated, service_role;
grant usage on type public.stroke_motion_character_role to authenticated, service_role;
grant usage on type public.stroke_motion_symbol_type to authenticated, service_role;
grant usage on type public.stroke_motion_transition_type to authenticated, service_role;
grant usage on type public.stroke_motion_timing_anchor_type to authenticated, service_role;
grant usage on type public.stroke_motion_generation_status to authenticated, service_role;
grant usage on type public.stroke_motion_output_format to authenticated, service_role;
grant usage on type public.stroke_motion_sfx_hint to authenticated, service_role;

revoke all on table public.stroke_motion_plans from public, anon;
revoke all on table public.stroke_motion_meaning_expansions from public, anon;
revoke all on table public.stroke_motion_beats from public, anon;
revoke all on table public.stroke_motion_characters from public, anon;
revoke all on table public.stroke_motion_symbols from public, anon;
revoke all on table public.stroke_motion_beat_characters from public, anon;
revoke all on table public.stroke_motion_beat_symbols from public, anon;
revoke all on table public.stroke_motion_transitions from public, anon;
revoke all on table public.stroke_motion_timing_anchors from public, anon;
revoke all on table public.stroke_motion_storyboard_frames from public, anon;
revoke all on table public.stroke_motion_generation_specs from public, anon;
revoke all on table public.stroke_motion_plan_examples from public, anon;

grant select, insert, update on table public.stroke_motion_plans to authenticated;
grant select, insert, update on table public.stroke_motion_meaning_expansions to authenticated;
grant select, insert, update on table public.stroke_motion_beats to authenticated;
grant select, insert, update on table public.stroke_motion_characters to authenticated;
grant select, insert, update on table public.stroke_motion_symbols to authenticated;
grant select, insert, delete on table public.stroke_motion_beat_characters to authenticated;
grant select, insert, delete on table public.stroke_motion_beat_symbols to authenticated;
grant select, insert, update on table public.stroke_motion_transitions to authenticated;
grant select, insert, update on table public.stroke_motion_timing_anchors to authenticated;
grant select, insert, update on table public.stroke_motion_storyboard_frames to authenticated;
grant select, insert, update on table public.stroke_motion_generation_specs to authenticated;
grant select on table public.stroke_motion_plan_examples to authenticated;

grant select, insert, update, delete on table public.stroke_motion_plans to service_role;
grant select, insert, update, delete on table public.stroke_motion_meaning_expansions to service_role;
grant select, insert, update, delete on table public.stroke_motion_beats to service_role;
grant select, insert, update, delete on table public.stroke_motion_characters to service_role;
grant select, insert, update, delete on table public.stroke_motion_symbols to service_role;
grant select, insert, update, delete on table public.stroke_motion_beat_characters to service_role;
grant select, insert, update, delete on table public.stroke_motion_beat_symbols to service_role;
grant select, insert, update, delete on table public.stroke_motion_transitions to service_role;
grant select, insert, update, delete on table public.stroke_motion_timing_anchors to service_role;
grant select, insert, update, delete on table public.stroke_motion_storyboard_frames to service_role;
grant select, insert, update, delete on table public.stroke_motion_generation_specs to service_role;
grant select, insert, update, delete on table public.stroke_motion_plan_examples to service_role;
