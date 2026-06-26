-- Source-alignment migration captured from Reeditpro staging migration history.
-- Remote target: Reeditpro / wmyyttnynmteqgcdishd / staging.
-- Remote version: 20260626163138.
-- Remote migration name: public_production_edit_session_brief_qwen_gates.
-- Purpose: preserve existing main Reeditpro staging schema history in repository source so future migration syncs do not repair away live product schema evidence.

create extension if not exists "pgcrypto";
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
alter table public.workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspaces'
      and column_name = 'owner_user_id'
  ) then
    execute 'update public.workspaces w set owner_id = owner_user_id where owner_id is null and owner_user_id is not null and exists (select 1 from auth.users au where au.id = w.owner_user_id)';
  end if;
end $$;
alter table public.projects
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'created_by'
  ) then
    execute 'update public.projects p set owner_id = created_by where owner_id is null and created_by is not null and exists (select 1 from auth.users au where au.id = p.created_by)';
  end if;
end $$;
create table if not exists public.edit_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.edit_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  status text not null default 'draft',
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  goal text,
  special_instructions text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.edit_cues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  edit_brief_id uuid references public.edit_briefs(id) on delete set null,
  title text not null,
  status text not null default 'draft',
  role text not null default 'reference_only',
  priority text not null default 'prefer',
  timing_flexibility text not null default 'ai_can_adjust',
  instructions text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.edit_cue_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  edit_cue_id uuid references public.edit_cues(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.edit_cue_conflicts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  edit_brief_id uuid references public.edit_briefs(id) on delete cascade,
  conflict_type text not null default 'qa_conflict',
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_method text not null,
  request_path text not null,
  request_hash text not null,
  response_status integer,
  response_hash text,
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, idempotency_key)
);
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;
create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and public.is_workspace_member(p.workspace_id)
  );
$$;
create or replace function public.is_project_editor(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = project_uuid
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin', 'editor')
  );
$$;
alter table public.edit_sessions
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists name text not null default 'Untitled Edit Chat',
  add column if not exists description text,
  add column if not exists aspect_ratio text not null default '9:16',
  add column if not exists custom_aspect_ratio jsonb,
  add column if not exists platform_target text not null default 'custom',
  add column if not exists thumbnail_url text,
  add column if not exists latest_preview_url text,
  add column if not exists source_media_asset_ids text[] not null default '{}',
  add column if not exists selected_edit_level text,
  add column if not exists selected_edit_preference_id text,
  add column if not exists selected_preference_version_id text,
  add column if not exists selected_edit_preference_handle text,
  add column if not exists preference_dna_application_id text,
  add column if not exists dna_status_label text,
  add column if not exists dna_qa_status_label text,
  add column if not exists do_not_copy_rules_active boolean not null default false,
  add column if not exists message_count integer not null default 0,
  add column if not exists revision_count integer not null default 0,
  add column if not exists version_count integer not null default 0,
  add column if not exists preview_count integer not null default 0,
  add column if not exists latest_snapshot_id uuid,
  add column if not exists latest_version_id uuid,
  add column if not exists latest_preview_id uuid,
  add column if not exists approval_status text not null default 'not_requested',
  add column if not exists archived_at timestamptz,
  add column if not exists last_opened_at timestamptz,
  add column if not exists mock_only boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
update public.edit_sessions es
set workspace_id = p.workspace_id
from public.projects p
where es.project_id = p.id
  and es.workspace_id is null;
update public.edit_sessions es
set owner_user_id = p.owner_id
from public.projects p
where es.project_id = p.id
  and es.owner_user_id is null;
create table if not exists public.project_edit_session_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  role text not null,
  kind text not null default 'text',
  text text not null,
  related_snapshot_id uuid,
  related_version_id uuid,
  related_preview_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  media_asset_id text not null,
  source_order_index integer not null default 0,
  label text,
  notes text[] not null default '{}',
  importance text not null default 'optional',
  thumbnail_url text,
  preview_url text,
  duration_seconds numeric,
  mime_type text,
  mock_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_memory (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  layer text not null,
  summary text not null,
  facts text[] not null default '{}',
  preferences text[] not null default '{}',
  warnings text[] not null default '{}',
  updated_from_message_id uuid,
  updated_from_revision_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edit_session_id, layer)
);
create table if not exists public.project_edit_session_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  kind text not null,
  version_number integer,
  message_id uuid,
  summary text not null,
  state jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  version_number integer not null default 1,
  status text not null default 'draft',
  name text not null,
  summary text not null,
  created_from_snapshot_id uuid references public.project_edit_session_snapshots(id) on delete set null,
  created_from_message_id uuid references public.project_edit_session_messages(id) on delete set null,
  preview_id uuid,
  approval_status text not null default 'not_requested',
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_previews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  version_id uuid references public.project_edit_session_versions(id) on delete set null,
  status text not null default 'placeholder_mock',
  thumbnail_url text,
  preview_url text,
  aspect_ratio text not null default '9:16',
  duration_seconds numeric,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  requested_by_message_id uuid references public.project_edit_session_messages(id) on delete set null,
  summary text not null,
  user_instruction text not null,
  resets_approval boolean not null default false,
  created_snapshot_id uuid references public.project_edit_session_snapshots(id) on delete set null,
  created_version_id uuid references public.project_edit_session_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.project_edit_session_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  status text not null default 'not_requested',
  summary text,
  requested_by_message_id uuid,
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.edit_briefs
  add column if not exists edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  add column if not exists availability text not null default 'optional_opened',
  add column if not exists title text not null default 'Edit Brief',
  add column if not exists summary text,
  add column if not exists marker_count integer not null default 0,
  add column if not exists confirmed_marker_count integer not null default 0,
  add column if not exists conflict_count integer not null default 0,
  add column if not exists needs_asset_count integer not null default 0,
  add column if not exists needs_clarification_count integer not null default 0,
  add column if not exists export_settings_id uuid,
  add column if not exists last_opened_at timestamptz,
  add column if not exists mock_only boolean not null default false;
alter table public.edit_briefs drop constraint if exists edit_briefs_status_check;
alter table public.edit_briefs
  add constraint edit_briefs_status_check check (
    status in (
      'not_created',
      'draft',
      'active',
      'needs_review',
      'ready_for_plan',
      'applied_to_plan',
      'changed_after_plan',
      'archived',
      'ready',
      'used_in_plan',
      'superseded'
    )
  );
update public.edit_briefs eb
set edit_session_id = eb.chat_session_id
where eb.edit_session_id is null
  and eb.chat_session_id is not null
  and exists (
    select 1
    from public.edit_sessions es
    where es.id = eb.chat_session_id
  );
alter table public.edit_cues
  add column if not exists edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  add column if not exists marker_type text not null default 'general_note',
  add column if not exists marker_status text not null default 'draft',
  add column if not exists marker_priority text not null default 'should_follow',
  add column if not exists time_mode text not null default 'point',
  add column if not exists start_time_seconds numeric not null default 0,
  add column if not exists end_time_seconds numeric,
  add column if not exists user_note text not null default '',
  add column if not exists ai_mode text not null default 'confirm_only',
  add column if not exists intent_id uuid,
  add column if not exists attachment_count integer not null default 0,
  add column if not exists message_count integer not null default 0,
  add column if not exists qa_status text not null default 'not_checked',
  add column if not exists mock_only boolean not null default false;
update public.edit_cues ec
set edit_session_id = eb.edit_session_id
from public.edit_briefs eb
where ec.edit_brief_id = eb.id
  and ec.edit_session_id is null;
alter table public.edit_cue_assets
  alter column media_asset_id drop not null,
  add column if not exists edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  add column if not exists brief_id uuid references public.edit_briefs(id) on delete cascade,
  add column if not exists marker_id uuid references public.edit_cues(id) on delete cascade,
  add column if not exists attachment_kind text not null default 'reference_label',
  add column if not exists attachment_status text not null default 'metadata_only',
  add column if not exists reference_url text,
  add column if not exists reference_label text,
  add column if not exists notes text[] not null default '{}',
  add column if not exists preview_label text,
  add column if not exists duration_seconds numeric,
  add column if not exists mock_only boolean not null default false;
update public.edit_cue_assets eca
set marker_id = eca.edit_cue_id
where eca.marker_id is null;
update public.edit_cue_assets eca
set brief_id = ec.edit_brief_id,
    edit_session_id = ec.edit_session_id
from public.edit_cues ec
where eca.edit_cue_id = ec.id
  and (eca.brief_id is null or eca.edit_session_id is null);
alter table public.edit_cue_conflicts
  add column if not exists edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  add column if not exists brief_id uuid references public.edit_briefs(id) on delete cascade,
  add column if not exists marker_id uuid references public.edit_cues(id) on delete cascade,
  add column if not exists related_marker_id uuid references public.edit_cues(id) on delete set null,
  add column if not exists qa_status text not null default 'conflict',
  add column if not exists title text not null default 'Marker conflict',
  add column if not exists summary text,
  add column if not exists recommended_resolution text,
  add column if not exists blocks_plan boolean not null default false,
  add column if not exists requires_user_review boolean not null default true,
  add column if not exists mock_only boolean not null default false;
update public.edit_cue_conflicts ecc
set brief_id = ecc.edit_brief_id
where ecc.brief_id is null;
create table if not exists public.edit_cue_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid not null references public.edit_cues(id) on delete cascade,
  role text not null,
  kind text not null default 'note',
  text text not null,
  related_intent_id uuid,
  related_attachment_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.edit_cue_intents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid not null references public.edit_cues(id) on delete cascade,
  action text not null,
  status text not null default 'draft_intent',
  instruction text not null,
  time_range_label text not null default '',
  start_time_seconds numeric not null default 0,
  end_time_seconds numeric,
  visual_behavior text not null default 'unspecified',
  audio_behavior text not null default 'unspecified',
  caption_behavior text not null default 'unspecified',
  asset_requirement text,
  provided_asset_ids text[] not null default '{}',
  priority text not null default 'should_follow',
  confidence text not null default 'medium',
  blocking_needs text[] not null default '{}',
  do_not_copy_notes text[] not null default '{}',
  planner_hints text[] not null default '{}',
  latest_user_message_id uuid references public.edit_cue_messages(id) on delete set null,
  latest_confirmation_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.edit_cue_confirmations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid not null references public.edit_cues(id) on delete cascade,
  intent_id uuid not null references public.edit_cue_intents(id) on delete cascade,
  summary text not null,
  confirmed_by_user boolean not null default false,
  ai_mode text not null default 'confirm_only',
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.edit_cue_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid not null references public.edit_cues(id) on delete cascade,
  previous_intent_id uuid references public.edit_cue_intents(id) on delete set null,
  new_intent_id uuid references public.edit_cue_intents(id) on delete set null,
  summary text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.edit_brief_application_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid references public.edit_cues(id) on delete set null,
  summary text not null,
  applied_to_plan boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.edit_session_export_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  source text not null default 'recommendation',
  platform_target text not null default 'custom',
  aspect_ratio text not null default '9:16',
  custom_aspect_ratio jsonb,
  resolution jsonb not null default '{"width":1080,"height":1920}'::jsonb,
  frame_rate numeric not null default 30,
  format text not null default 'mp4',
  codec text not null default 'h264',
  audio_codec text not null default 'aac',
  audio_loudness_target text,
  caption_safe_area boolean not null default true,
  safe_zone_preset text,
  delivery_preset text not null default 'custom',
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  mock_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edit_session_id)
);
create table if not exists public.production_route_rate_limits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  marker_id uuid references public.edit_cues(id) on delete cascade,
  route_id text not null,
  scope_key text not null,
  window_started_at timestamptz not null,
  hit_count integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_id, scope_key, window_started_at)
);
create table if not exists public.production_observability_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  edit_session_id uuid references public.edit_sessions(id) on delete cascade,
  marker_id uuid references public.edit_cues(id) on delete set null,
  request_id text,
  event_type text not null,
  severity text not null default 'info',
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.qwen_marker_chat_provider_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  marker_id uuid not null references public.edit_cues(id) on delete cascade,
  request_id text not null,
  route_id text not null default 'project.editBrief.markerMessages.append',
  model_id_label text,
  status text not null,
  latency_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  validation_status text,
  fallback_reason text,
  redaction_flags jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_project_edit_session_messages_session_created on public.project_edit_session_messages(edit_session_id, created_at);
create index if not exists idx_project_edit_session_sources_session_order on public.project_edit_session_sources(edit_session_id, source_order_index);
create index if not exists idx_project_edit_session_memory_session_layer on public.project_edit_session_memory(edit_session_id, layer);
create index if not exists idx_project_edit_session_snapshots_session_created on public.project_edit_session_snapshots(edit_session_id, created_at);
create index if not exists idx_project_edit_session_versions_session_number on public.project_edit_session_versions(edit_session_id, version_number);
create index if not exists idx_project_edit_session_previews_session_created on public.project_edit_session_previews(edit_session_id, created_at);
create index if not exists idx_project_edit_session_revisions_session_created on public.project_edit_session_revisions(edit_session_id, created_at);
create index if not exists idx_project_edit_session_events_session_created on public.project_edit_session_events(edit_session_id, created_at);
create index if not exists idx_edit_briefs_edit_session_id on public.edit_briefs(edit_session_id);
create index if not exists idx_edit_cues_edit_session_id on public.edit_cues(edit_session_id);
create index if not exists idx_edit_cues_edit_brief_marker_status on public.edit_cues(edit_brief_id, marker_status);
create index if not exists idx_edit_cue_messages_marker_created on public.edit_cue_messages(marker_id, created_at);
create index if not exists idx_edit_cue_intents_marker_updated on public.edit_cue_intents(marker_id, updated_at);
create index if not exists idx_edit_cue_confirmations_marker_created on public.edit_cue_confirmations(marker_id, created_at);
create index if not exists idx_edit_cue_revisions_marker_created on public.edit_cue_revisions(marker_id, created_at);
create index if not exists idx_edit_brief_application_logs_brief_created on public.edit_brief_application_logs(brief_id, created_at);
create index if not exists idx_production_route_rate_limits_scope on public.production_route_rate_limits(route_id, scope_key, window_started_at);
create index if not exists idx_production_observability_events_request on public.production_observability_events(request_id, created_at);
create index if not exists idx_qwen_marker_chat_provider_attempts_request on public.qwen_marker_chat_provider_attempts(request_id, created_at);
drop trigger if exists set_project_edit_session_sources_updated_at on public.project_edit_session_sources;
create trigger set_project_edit_session_sources_updated_at before update on public.project_edit_session_sources
for each row execute function public.set_updated_at();
drop trigger if exists set_project_edit_session_memory_updated_at on public.project_edit_session_memory;
create trigger set_project_edit_session_memory_updated_at before update on public.project_edit_session_memory
for each row execute function public.set_updated_at();
drop trigger if exists set_project_edit_session_approvals_updated_at on public.project_edit_session_approvals;
create trigger set_project_edit_session_approvals_updated_at before update on public.project_edit_session_approvals
for each row execute function public.set_updated_at();
drop trigger if exists set_edit_session_export_settings_updated_at on public.edit_session_export_settings;
create trigger set_edit_session_export_settings_updated_at before update on public.edit_session_export_settings
for each row execute function public.set_updated_at();
drop trigger if exists set_production_route_rate_limits_updated_at on public.production_route_rate_limits;
create trigger set_production_route_rate_limits_updated_at before update on public.production_route_rate_limits
for each row execute function public.set_updated_at();
alter table public.edit_sessions enable row level security;
alter table public.edit_briefs enable row level security;
alter table public.edit_cues enable row level security;
alter table public.edit_cue_assets enable row level security;
alter table public.edit_cue_conflicts enable row level security;
alter table public.api_idempotency_keys enable row level security;
alter table public.project_edit_session_messages enable row level security;
alter table public.project_edit_session_sources enable row level security;
alter table public.project_edit_session_memory enable row level security;
alter table public.project_edit_session_snapshots enable row level security;
alter table public.project_edit_session_versions enable row level security;
alter table public.project_edit_session_previews enable row level security;
alter table public.project_edit_session_revisions enable row level security;
alter table public.project_edit_session_events enable row level security;
alter table public.project_edit_session_approvals enable row level security;
alter table public.edit_cue_messages enable row level security;
alter table public.edit_cue_intents enable row level security;
alter table public.edit_cue_confirmations enable row level security;
alter table public.edit_cue_revisions enable row level security;
alter table public.edit_brief_application_logs enable row level security;
alter table public.edit_session_export_settings enable row level security;
alter table public.production_route_rate_limits enable row level security;
alter table public.production_observability_events enable row level security;
alter table public.qwen_marker_chat_provider_attempts enable row level security;
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'edit_sessions',
    'edit_briefs',
    'edit_cues',
    'edit_cue_assets',
    'edit_cue_conflicts',
    'project_edit_session_messages',
    'project_edit_session_sources',
    'project_edit_session_memory',
    'project_edit_session_snapshots',
    'project_edit_session_versions',
    'project_edit_session_previews',
    'project_edit_session_revisions',
    'project_edit_session_events',
    'project_edit_session_approvals',
    'edit_cue_messages',
    'edit_cue_intents',
    'edit_cue_confirmations',
    'edit_cue_revisions',
    'edit_brief_application_logs',
    'edit_session_export_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_project_member', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_project_member(project_id))', table_name || '_select_project_member', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_project_editor', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_project_editor(project_id))', table_name || '_insert_project_editor', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_project_editor', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_project_editor(project_id)) with check (public.is_project_editor(project_id))', table_name || '_update_project_editor', table_name);
  end loop;
end $$;
drop policy if exists production_route_rate_limits_service_role_only on public.production_route_rate_limits;
create policy production_route_rate_limits_service_role_only
on public.production_route_rate_limits for all
to service_role
using (true)
with check (true);
drop policy if exists production_observability_events_service_role_only on public.production_observability_events;
create policy production_observability_events_service_role_only
on public.production_observability_events for all
to service_role
using (true)
with check (true);
drop policy if exists qwen_marker_chat_provider_attempts_service_role_only on public.qwen_marker_chat_provider_attempts;
create policy qwen_marker_chat_provider_attempts_service_role_only
on public.qwen_marker_chat_provider_attempts for all
to service_role
using (true)
with check (true);
drop policy if exists api_idempotency_keys_service_role_only on public.api_idempotency_keys;
create policy api_idempotency_keys_service_role_only
on public.api_idempotency_keys for all
to service_role
using (true)
with check (true);
revoke all privileges on table
  public.edit_sessions,
  public.project_edit_session_messages,
  public.project_edit_session_sources,
  public.project_edit_session_memory,
  public.project_edit_session_snapshots,
  public.project_edit_session_versions,
  public.project_edit_session_previews,
  public.project_edit_session_revisions,
  public.project_edit_session_events,
  public.project_edit_session_approvals,
  public.edit_briefs,
  public.edit_cues,
  public.edit_cue_assets,
  public.edit_cue_conflicts,
  public.edit_cue_messages,
  public.edit_cue_intents,
  public.edit_cue_confirmations,
  public.edit_cue_revisions,
  public.edit_brief_application_logs,
  public.edit_session_export_settings,
  public.api_idempotency_keys,
  public.production_route_rate_limits,
  public.production_observability_events,
  public.qwen_marker_chat_provider_attempts
from anon;
revoke all privileges on table
  public.production_route_rate_limits,
  public.api_idempotency_keys,
  public.production_observability_events,
  public.qwen_marker_chat_provider_attempts
from authenticated;
grant select, insert, update on table
  public.edit_sessions,
  public.project_edit_session_messages,
  public.project_edit_session_sources,
  public.project_edit_session_memory,
  public.project_edit_session_snapshots,
  public.project_edit_session_versions,
  public.project_edit_session_previews,
  public.project_edit_session_revisions,
  public.project_edit_session_events,
  public.project_edit_session_approvals,
  public.edit_briefs,
  public.edit_cues,
  public.edit_cue_assets,
  public.edit_cue_conflicts,
  public.edit_cue_messages,
  public.edit_cue_intents,
  public.edit_cue_confirmations,
  public.edit_cue_revisions,
  public.edit_brief_application_logs,
  public.edit_session_export_settings
to authenticated;
grant select, insert, update, delete on table
  public.edit_sessions,
  public.project_edit_session_messages,
  public.project_edit_session_sources,
  public.project_edit_session_memory,
  public.project_edit_session_snapshots,
  public.project_edit_session_versions,
  public.project_edit_session_previews,
  public.project_edit_session_revisions,
  public.project_edit_session_events,
  public.project_edit_session_approvals,
  public.edit_briefs,
  public.edit_cues,
  public.edit_cue_assets,
  public.edit_cue_conflicts,
  public.edit_cue_messages,
  public.edit_cue_intents,
  public.edit_cue_confirmations,
  public.edit_cue_revisions,
  public.edit_brief_application_logs,
  public.edit_session_export_settings,
  public.production_route_rate_limits,
  public.production_observability_events,
  public.qwen_marker_chat_provider_attempts
to service_role;
comment on table public.production_route_rate_limits is
'Durable production route rate-limit counters. Service-role only; no secrets, raw prompts, signed URLs, provider payloads, or media bytes.';
comment on table public.production_observability_events is
'Sanitized production event log for auth, repository, Qwen, fallback, rate-limit, idempotency, and validation decisions.';
comment on table public.qwen_marker_chat_provider_attempts is
'Sanitized Qwen Marker Chat provider attempt metadata. Never store provider keys, Authorization headers, raw provider payloads, hidden reasoning, or Secret Manager values.';
