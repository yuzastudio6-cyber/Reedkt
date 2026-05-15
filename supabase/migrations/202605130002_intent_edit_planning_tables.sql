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
  create type public.edit_complexity as enum (
    'basic_edit',
    'pro_edit',
    'signature_edit',
    'premium_signature_edit'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.edit_plan_status as enum (
    'draft',
    'planning',
    'awaiting_user_input',
    'awaiting_approval',
    'approved',
    'generating',
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
  create type public.hook_policy as enum (
    'required',
    'recommended',
    'optional',
    'not_needed',
    'avoid'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_beat_type as enum (
    'hook',
    'setup',
    'problem',
    'explanation',
    'example',
    'solution',
    'transformation',
    'result',
    'cta',
    'proof',
    'transition',
    'context',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.story_beat_status as enum (
    'planned',
    'active',
    'optional',
    'skipped',
    'needs_review'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.signature_system as enum (
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'sound_sync',
    'none'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.signature_route_requirement as enum (
    'required',
    'recommended',
    'optional',
    'not_recommended',
    'blocked_by_user'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.edit_instruction_type as enum (
    'cutting',
    'caption',
    'audio',
    'transition',
    'stroke_motion',
    'graphic_design',
    'real_motion',
    'soundsync',
    'render',
    'quality_check',
    'credit',
    'user_instruction',
    'worker_note'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.worker_target as enum (
    'chat_intent_agent',
    'media_analysis_agent',
    'source_sequence_agent',
    'edit_quality_agent',
    'pacing_agent',
    'transition_agent',
    'audio_environment_agent',
    'music_supervisor_agent',
    'sfx_agent',
    'signature_investigation_agent',
    'stroke_motion_story_agent',
    'credit_estimation_agent',
    'generation_orchestrator',
    'stroke_motion_generation_worker',
    'graphic_design_worker',
    'real_motion_worker',
    'soundsync_worker',
    'render_worker',
    'quality_check_agent',
    'human_editor',
    'none'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.planning_confidence as enum (
    'low',
    'medium',
    'high',
    'needs_user_confirmation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_instruction_priority as enum (
    'must_follow',
    'strong_preference',
    'soft_preference',
    'avoid',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

comment on type public.edit_complexity is
'Edit complexity controls compute depth and cost, not quality. basic_edit means professional clean editing with lower compute, not low-quality editing.';

create table public.intent_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  created_by_user_id uuid references public.user_profiles(id) on delete set null,
  detected_user_goal text,
  user_goal_summary text,
  requested_style text,
  requested_platform public.target_platform,
  requested_aspect_ratio public.aspect_ratio,
  edit_complexity public.edit_complexity not null default 'basic_edit',
  hook_policy public.hook_policy not null default 'optional',
  credit_sensitivity text not null default 'balanced',
  must_follow_instructions jsonb not null default '[]'::jsonb,
  avoid_instructions jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  confidence public.planning_confidence not null default 'medium',
  raw_input_snapshot jsonb not null default '{}'::jsonb,
  analysis_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.intent_analyses is
'Structured AI understanding of the user chat request before planning. User instructions have priority over inferred workflow context.';
comment on column public.intent_analyses.edit_complexity is
'Represents Basic, Pro, Signature, or Premium Signature complexity. Basic is professional clean editing with lower compute, not low-quality editing.';
comment on column public.intent_analyses.raw_input_snapshot is
'Snapshot of chat, project, source clip, and reference context used for planning. This is not a provider payload or secret store.';

create table public.source_sequence_maps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  source_clip_sequence_id uuid not null references public.source_clip_sequences(id) on delete cascade,
  intent_analysis_id uuid references public.intent_analyses(id) on delete set null,
  summary text,
  detected_story_order text,
  strong_moments jsonb not null default '[]'::jsonb,
  weak_moments jsonb not null default '[]'::jsonb,
  clip_role_summary jsonb not null default '[]'::jsonb,
  ai_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.source_sequence_maps is
'AI interpretation of the user-uploaded source clip sequence. Uploaded order is planning context and is not automatically the final edit order.';

create table public.source_sequence_map_items (
  id uuid primary key default gen_random_uuid(),
  source_sequence_map_id uuid not null references public.source_sequence_maps(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_clip_sequence_item_id uuid not null references public.source_clip_sequence_items(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  uploaded_order integer not null check (uploaded_order > 0),
  detected_role text,
  story_function text,
  strengths jsonb not null default '[]'::jsonb,
  concerns jsonb not null default '[]'::jsonb,
  possible_uses jsonb not null default '[]'::jsonb,
  recommended_use text,
  should_preserve_order boolean not null default true,
  ai_notes text,
  created_at timestamptz not null default now(),
  unique (source_sequence_map_id, source_clip_sequence_item_id)
);

comment on table public.source_sequence_map_items is
'Per-clip source sequence analysis. The uploaded_order column mirrors user source order, not final edit order.';

create table public.recommended_edit_structures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  intent_analysis_id uuid references public.intent_analyses(id) on delete set null,
  source_sequence_map_id uuid references public.source_sequence_maps(id) on delete set null,
  structure_summary text not null,
  preserve_source_order boolean not null default true,
  restructure_reason text,
  hook_policy public.hook_policy not null default 'optional',
  structure_steps jsonb not null default '[]'::jsonb,
  user_approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.recommended_edit_structures is
'AI proposed final edit structure. It is separate from source sequence and is not applied until the user approves the edit plan.';

create table public.edit_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  created_by_user_id uuid references public.user_profiles(id) on delete set null,
  intent_analysis_id uuid references public.intent_analyses(id) on delete set null,
  source_sequence_map_id uuid references public.source_sequence_maps(id) on delete set null,
  recommended_edit_structure_id uuid references public.recommended_edit_structures(id) on delete set null,
  plan_version integer not null default 1 check (plan_version > 0),
  status public.edit_plan_status not null default 'draft',
  edit_complexity public.edit_complexity not null default 'basic_edit',
  goal_summary text,
  workflow_context text,
  target_platform public.target_platform,
  aspect_ratio public.aspect_ratio,
  hook_policy public.hook_policy not null default 'optional',
  credit_estimate_id uuid,
  approval_required boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approval_chat_action_id uuid references public.chat_actions(id) on delete set null,
  plan_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, plan_version)
);

comment on table public.edit_plans is
'User-visible edit plan shown in chat. This plan must be approved before generation starts; credit estimate and credit approval tables are future migrations.';
comment on column public.edit_plans.credit_estimate_id is
'Reserved nullable reference for future credit_estimates. No foreign key is added in RP-DB-04.';
comment on column public.edit_plans.approval_chat_action_id is
'Chat action used to approve the edit plan. Credit approval is modeled in a future migration.';

create table public.story_beat_maps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  summary text,
  beat_map_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.story_beat_maps is
'Story structure for an edit plan. StoryTiming later coordinates beats with captions, cuts, signatures, SoundSync, and rendering.';

create table public.story_beats (
  id uuid primary key default gen_random_uuid(),
  story_beat_map_id uuid not null references public.story_beat_maps(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  beat_order integer not null check (beat_order > 0),
  beat_type public.story_beat_type not null default 'custom',
  status public.story_beat_status not null default 'planned',
  label text not null,
  summary text,
  start_time_seconds numeric check (start_time_seconds is null or start_time_seconds >= 0),
  end_time_seconds numeric check (end_time_seconds is null or end_time_seconds >= 0),
  matched_transcript text,
  emotional_tone text,
  viewer_purpose text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_beat_map_id, beat_order),
  check (end_time_seconds is null or start_time_seconds is null or end_time_seconds >= start_time_seconds)
);

create table public.edit_plan_segments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  story_beat_id uuid references public.story_beats(id) on delete set null,
  source_clip_sequence_item_id uuid references public.source_clip_sequence_items(id) on delete set null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  segment_order integer not null check (segment_order > 0),
  source_start_seconds numeric check (source_start_seconds is null or source_start_seconds >= 0),
  source_end_seconds numeric check (source_end_seconds is null or source_end_seconds >= 0),
  output_start_seconds numeric check (output_start_seconds is null or output_start_seconds >= 0),
  output_end_seconds numeric check (output_end_seconds is null or output_end_seconds >= 0),
  transcript_text text,
  story_beat_label text,
  segment_purpose text,
  ai_understanding text,
  recommended_action text,
  signature_system public.signature_system not null default 'none',
  signature_required boolean not null default false,
  signature_optional boolean not null default false,
  signature_reason text,
  credit_impact text not null default 'low' check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  notes_for_editor text,
  must_follow_rules jsonb not null default '[]'::jsonb,
  avoid_rules jsonb not null default '[]'::jsonb,
  segment_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edit_plan_id, segment_order),
  check (source_end_seconds is null or source_start_seconds is null or source_end_seconds >= source_start_seconds),
  check (output_end_seconds is null or output_start_seconds is null or output_end_seconds >= output_start_seconds)
);

comment on table public.edit_plan_segments is
'Segment-level edit plan. Each segment stores what the AI understood, what action is recommended, whether a signature system is needed, and notes for future workers.';
comment on column public.edit_plan_segments.signature_system is
'Basic edits can use none. Signature edits route Stroke Motion, Graphic Design / VisualExplain, Real Motion, or SoundSync per segment. Video type never automatically forces a signature system.';
comment on column public.edit_plan_segments.notes_for_editor is
'Planning notes for downstream editors/workers. These notes do not start generation.';

create table public.signature_routes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  signature_system public.signature_system not null,
  requirement public.signature_route_requirement not null default 'optional',
  reason text not null,
  timing_notes text,
  credit_impact text not null default 'low' check (credit_impact in ('none', 'low', 'medium', 'high', 'premium')),
  approval_needed boolean not null default false,
  user_can_remove boolean not null default true,
  worker_target public.worker_target not null default 'none',
  generation_request_id uuid,
  route_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.signature_routes is
'Records why a signature system belongs or does not belong in a segment. All video types can use all signature systems or none; the AI decides per segment.';
comment on column public.signature_routes.generation_request_id is
'Reserved nullable reference for future generation_requests. No foreign key is added in RP-DB-04.';

create table public.edit_instructions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  instruction_type public.edit_instruction_type not null,
  target_worker public.worker_target not null default 'none',
  instruction_text text not null,
  priority public.user_instruction_priority not null default 'soft_preference',
  must_follow boolean not null default false,
  avoid boolean not null default false,
  source_chat_message_id uuid references public.chat_messages(id) on delete set null,
  created_by_agent text,
  status text not null default 'active' check (status in ('active', 'completed', 'dismissed', 'superseded', 'failed')),
  instruction_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.edit_instructions is
'Structured instructions and worker notes extracted from chat, intent analysis, and planning. Examples include must-follow rules, avoid rules, and downstream editor/worker guidance.';
comment on column public.edit_instructions.must_follow is
'True when this instruction must be followed by downstream planners/workers unless the user changes it.';
comment on column public.edit_instructions.avoid is
'True when this instruction describes something downstream planners/workers must avoid.';

create table public.planning_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete cascade,
  edit_plan_segment_id uuid references public.edit_plan_segments(id) on delete cascade,
  note_type text not null,
  title text,
  note text not null,
  payload jsonb not null default '{}'::jsonb,
  visible_to_user boolean not null default false,
  created_by_agent text,
  created_at timestamptz not null default now()
);

comment on table public.planning_notes is
'Structured planning notes for reasoning that should not be forced into rigid columns. Notes can be hidden from users or surfaced in chat.';

create table public.edit_plan_chat_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid not null references public.edit_plans(id) on delete cascade,
  inline_chat_card_id uuid not null references public.inline_chat_cards(id) on delete cascade,
  card_role text not null default 'plan_summary' check (
    card_role in (
      'plan_summary',
      'source_sequence',
      'signature_routes',
      'credit_estimate',
      'approval_request',
      'preview_ready'
    )
  ),
  created_at timestamptz not null default now(),
  unique (edit_plan_id, inline_chat_card_id)
);

comment on table public.edit_plan_chat_cards is
'Links edit plans to inline chat cards because ReeditPro shows planning, approvals, and future previews inside chat.';

do $$
begin
  alter table public.projects
  add column if not exists current_edit_plan_id uuid;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_current_edit_plan_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_current_edit_plan_id_fkey
    foreign key (current_edit_plan_id) references public.edit_plans(id) on delete set null;
  end if;
end $$;

create index intent_analyses_workspace_id_idx on public.intent_analyses (workspace_id);
create index intent_analyses_project_id_idx on public.intent_analyses (project_id);
create index intent_analyses_chat_session_id_idx on public.intent_analyses (chat_session_id);
create index intent_analyses_chat_message_id_idx on public.intent_analyses (chat_message_id);
create index intent_analyses_edit_complexity_idx on public.intent_analyses (edit_complexity);
create index intent_analyses_hook_policy_idx on public.intent_analyses (hook_policy);
create index intent_analyses_confidence_idx on public.intent_analyses (confidence);
create index source_sequence_maps_workspace_id_idx on public.source_sequence_maps (workspace_id);
create index source_sequence_maps_project_id_idx on public.source_sequence_maps (project_id);
create index source_sequence_maps_source_clip_sequence_id_idx on public.source_sequence_maps (source_clip_sequence_id);
create index source_sequence_maps_intent_analysis_id_idx on public.source_sequence_maps (intent_analysis_id);
create index source_sequence_map_items_map_id_idx on public.source_sequence_map_items (source_sequence_map_id);
create index source_sequence_map_items_project_id_idx on public.source_sequence_map_items (project_id);
create index source_sequence_map_items_media_asset_id_idx on public.source_sequence_map_items (media_asset_id);
create index source_sequence_map_items_uploaded_order_idx on public.source_sequence_map_items (uploaded_order);
create index recommended_edit_structures_workspace_id_idx on public.recommended_edit_structures (workspace_id);
create index recommended_edit_structures_project_id_idx on public.recommended_edit_structures (project_id);
create index recommended_edit_structures_chat_session_id_idx on public.recommended_edit_structures (chat_session_id);
create index recommended_edit_structures_intent_analysis_id_idx on public.recommended_edit_structures (intent_analysis_id);
create index recommended_edit_structures_source_sequence_map_id_idx on public.recommended_edit_structures (source_sequence_map_id);
create index edit_plans_workspace_id_idx on public.edit_plans (workspace_id);
create index edit_plans_project_id_idx on public.edit_plans (project_id);
create index edit_plans_chat_session_id_idx on public.edit_plans (chat_session_id);
create index edit_plans_status_idx on public.edit_plans (status);
create index edit_plans_edit_complexity_idx on public.edit_plans (edit_complexity);
create index edit_plans_intent_analysis_id_idx on public.edit_plans (intent_analysis_id);
create index edit_plans_approved_at_idx on public.edit_plans (approved_at);
create index story_beat_maps_workspace_id_idx on public.story_beat_maps (workspace_id);
create index story_beat_maps_project_id_idx on public.story_beat_maps (project_id);
create index story_beat_maps_edit_plan_id_idx on public.story_beat_maps (edit_plan_id);
create index story_beats_story_beat_map_id_idx on public.story_beats (story_beat_map_id);
create index story_beats_project_id_idx on public.story_beats (project_id);
create index story_beats_edit_plan_id_idx on public.story_beats (edit_plan_id);
create index story_beats_beat_order_idx on public.story_beats (beat_order);
create index story_beats_beat_type_idx on public.story_beats (beat_type);
create index story_beats_status_idx on public.story_beats (status);
create index edit_plan_segments_workspace_id_idx on public.edit_plan_segments (workspace_id);
create index edit_plan_segments_project_id_idx on public.edit_plan_segments (project_id);
create index edit_plan_segments_edit_plan_id_idx on public.edit_plan_segments (edit_plan_id);
create index edit_plan_segments_story_beat_id_idx on public.edit_plan_segments (story_beat_id);
create index edit_plan_segments_source_clip_item_id_idx on public.edit_plan_segments (source_clip_sequence_item_id);
create index edit_plan_segments_media_asset_id_idx on public.edit_plan_segments (media_asset_id);
create index edit_plan_segments_segment_order_idx on public.edit_plan_segments (segment_order);
create index edit_plan_segments_signature_system_idx on public.edit_plan_segments (signature_system);
create index signature_routes_workspace_id_idx on public.signature_routes (workspace_id);
create index signature_routes_project_id_idx on public.signature_routes (project_id);
create index signature_routes_edit_plan_id_idx on public.signature_routes (edit_plan_id);
create index signature_routes_segment_id_idx on public.signature_routes (edit_plan_segment_id);
create index signature_routes_signature_system_idx on public.signature_routes (signature_system);
create index signature_routes_requirement_idx on public.signature_routes (requirement);
create index signature_routes_approval_needed_idx on public.signature_routes (approval_needed);
create index signature_routes_worker_target_idx on public.signature_routes (worker_target);
create index edit_instructions_workspace_id_idx on public.edit_instructions (workspace_id);
create index edit_instructions_project_id_idx on public.edit_instructions (project_id);
create index edit_instructions_edit_plan_id_idx on public.edit_instructions (edit_plan_id);
create index edit_instructions_segment_id_idx on public.edit_instructions (edit_plan_segment_id);
create index edit_instructions_instruction_type_idx on public.edit_instructions (instruction_type);
create index edit_instructions_target_worker_idx on public.edit_instructions (target_worker);
create index edit_instructions_priority_idx on public.edit_instructions (priority);
create index edit_instructions_must_follow_idx on public.edit_instructions (must_follow);
create index edit_instructions_avoid_idx on public.edit_instructions (avoid);
create index planning_notes_workspace_id_idx on public.planning_notes (workspace_id);
create index planning_notes_project_id_idx on public.planning_notes (project_id);
create index planning_notes_edit_plan_id_idx on public.planning_notes (edit_plan_id);
create index planning_notes_segment_id_idx on public.planning_notes (edit_plan_segment_id);
create index planning_notes_note_type_idx on public.planning_notes (note_type);
create index planning_notes_visible_to_user_idx on public.planning_notes (visible_to_user);
create index edit_plan_chat_cards_workspace_id_idx on public.edit_plan_chat_cards (workspace_id);
create index edit_plan_chat_cards_project_id_idx on public.edit_plan_chat_cards (project_id);
create index edit_plan_chat_cards_edit_plan_id_idx on public.edit_plan_chat_cards (edit_plan_id);
create index edit_plan_chat_cards_inline_chat_card_id_idx on public.edit_plan_chat_cards (inline_chat_card_id);
create index edit_plan_chat_cards_card_role_idx on public.edit_plan_chat_cards (card_role);

create trigger intent_analyses_set_updated_at
before update on public.intent_analyses
for each row execute function public.set_updated_at();

create trigger source_sequence_maps_set_updated_at
before update on public.source_sequence_maps
for each row execute function public.set_updated_at();

create trigger recommended_edit_structures_set_updated_at
before update on public.recommended_edit_structures
for each row execute function public.set_updated_at();

create trigger edit_plans_set_updated_at
before update on public.edit_plans
for each row execute function public.set_updated_at();

create trigger story_beat_maps_set_updated_at
before update on public.story_beat_maps
for each row execute function public.set_updated_at();

create trigger story_beats_set_updated_at
before update on public.story_beats
for each row execute function public.set_updated_at();

create trigger edit_plan_segments_set_updated_at
before update on public.edit_plan_segments
for each row execute function public.set_updated_at();

create trigger signature_routes_set_updated_at
before update on public.signature_routes
for each row execute function public.set_updated_at();

create trigger edit_instructions_set_updated_at
before update on public.edit_instructions
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

alter table public.intent_analyses enable row level security;
alter table public.source_sequence_maps enable row level security;
alter table public.source_sequence_map_items enable row level security;
alter table public.recommended_edit_structures enable row level security;
alter table public.edit_plans enable row level security;
alter table public.story_beat_maps enable row level security;
alter table public.story_beats enable row level security;
alter table public.edit_plan_segments enable row level security;
alter table public.signature_routes enable row level security;
alter table public.edit_instructions enable row level security;
alter table public.planning_notes enable row level security;
alter table public.edit_plan_chat_cards enable row level security;

create policy intent_analyses_select_member
on public.intent_analyses for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy intent_analyses_insert_editor
on public.intent_analyses for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy intent_analyses_update_editor
on public.intent_analyses for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_sequence_maps_select_member
on public.source_sequence_maps for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy source_sequence_maps_insert_editor
on public.source_sequence_maps for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_sequence_maps_update_editor
on public.source_sequence_maps for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_sequence_map_items_select_member
on public.source_sequence_map_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy source_sequence_map_items_insert_editor
on public.source_sequence_map_items for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_sequence_map_items_update_editor
on public.source_sequence_map_items for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy recommended_edit_structures_select_member
on public.recommended_edit_structures for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy recommended_edit_structures_insert_editor
on public.recommended_edit_structures for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy recommended_edit_structures_update_editor
on public.recommended_edit_structures for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plans_select_member
on public.edit_plans for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_plans_insert_editor
on public.edit_plans for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plans_update_editor
on public.edit_plans for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy story_beat_maps_select_member
on public.story_beat_maps for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy story_beat_maps_insert_editor
on public.story_beat_maps for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy story_beat_maps_update_editor
on public.story_beat_maps for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy story_beats_select_member
on public.story_beats for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy story_beats_insert_editor
on public.story_beats for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy story_beats_update_editor
on public.story_beats for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plan_segments_select_member
on public.edit_plan_segments for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_plan_segments_insert_editor
on public.edit_plan_segments for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plan_segments_update_editor
on public.edit_plan_segments for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy signature_routes_select_member
on public.signature_routes for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy signature_routes_insert_editor
on public.signature_routes for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy signature_routes_update_editor
on public.signature_routes for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_instructions_select_member
on public.edit_instructions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_instructions_insert_editor
on public.edit_instructions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_instructions_update_editor
on public.edit_instructions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy planning_notes_select_member
on public.planning_notes for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy planning_notes_insert_editor
on public.planning_notes for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy planning_notes_update_editor
on public.planning_notes for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plan_chat_cards_select_member
on public.edit_plan_chat_cards for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy edit_plan_chat_cards_insert_editor
on public.edit_plan_chat_cards for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy edit_plan_chat_cards_update_editor
on public.edit_plan_chat_cards for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));
