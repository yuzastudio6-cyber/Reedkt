-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create table if not exists public.edit_intent_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  version integer not null,
  status text not null default 'draft',
  editing_category text,
  edit_level text,
  target_platform text,
  aspect_ratio text,
  frame_template_type text,
  goal_summary text,
  compiled_intent_json jsonb not null default '{}'::jsonb,
  professional_editing_directive_json jsonb not null default '{}'::jsonb,
  created_from_message_ids_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table if not exists public.edit_settings_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  intent_snapshot_id uuid references public.edit_intent_snapshots(id) on delete set null,
  settings_json jsonb not null default '{}'::jsonb,
  source_order_confirmed boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.edit_plan_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  intent_snapshot_id uuid references public.edit_intent_snapshots(id) on delete set null,
  version integer not null,
  status text not null default 'draft',
  goal_summary text,
  plan_summary_json jsonb not null default '{}'::jsonb,
  full_plan_json jsonb not null default '{}'::jsonb,
  credit_estimate_id uuid,
  approval_required boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  superseded_by_plan_version_id uuid references public.edit_plan_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);

create table if not exists public.plan_component_snapshots (
  id uuid primary key default gen_random_uuid(),
  edit_plan_version_id uuid not null references public.edit_plan_versions(id) on delete cascade,
  component_type text not null,
  component_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.edit_plan_segments (
  id uuid primary key default gen_random_uuid(),
  edit_plan_version_id uuid not null references public.edit_plan_versions(id) on delete cascade,
  segment_order integer not null,
  role text,
  label text,
  story_purpose text,
  source_clip_ids_json jsonb not null default '[]'::jsonb,
  source_time_range_json jsonb not null default '{}'::jsonb,
  final_time_range_json jsonb not null default '{}'::jsonb,
  segment_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.edit_plan_segments
  add column if not exists edit_plan_version_id uuid;

alter table public.edit_plan_segments
  add column if not exists segment_order integer not null default 0;

do $$
begin
  if to_regclass('public.edit_plan_segments') is not null
    and to_regclass('public.edit_plan_versions') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'edit_plan_segments'
        and column_name = 'edit_plan_version_id'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'edit_plan_versions'
        and column_name = 'id'
    )
    and not exists (
      select 1
      from pg_constraint
      where conname = 'edit_plan_segments_edit_plan_version_id_fkey'
        and conrelid = 'public.edit_plan_segments'::regclass
    )
  then
    alter table public.edit_plan_segments
      add constraint edit_plan_segments_edit_plan_version_id_fkey
      foreign key (edit_plan_version_id)
      references public.edit_plan_versions(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.edit_operations (
  id uuid primary key default gen_random_uuid(),
  edit_plan_segment_id uuid not null references public.edit_plan_segments(id) on delete cascade,
  operation_type text,
  operation_order integer not null,
  label text,
  instruction text,
  parameters_json jsonb not null default '{}'::jsonb,
  reason text,
  status text not null default 'planned',
  qa_checks_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.edit_intent_snapshots is 'Versioned compiled user intent. Do not rely on raw chat alone for planning.';
comment on table public.edit_plan_versions is 'Versioned edit plans. full_plan_json preserves the full typed plan before approval.';
comment on table public.plan_component_snapshots is 'Optional deeper normalization for planning components while full JSONB remains source of detail.';
comment on table public.edit_operations is 'Worker-readable edit operations; execution requires approved plan snapshots.';

create index if not exists idx_edit_intent_snapshots_project_version on public.edit_intent_snapshots(project_id, version);
create index if not exists idx_edit_plan_versions_project_version on public.edit_plan_versions(project_id, version);
create index if not exists idx_edit_plan_versions_session_status on public.edit_plan_versions(edit_session_id, status);
create index if not exists idx_plan_component_snapshots_plan_type on public.plan_component_snapshots(edit_plan_version_id, component_type);
do $$
begin
  if to_regclass('public.edit_plan_segments') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'edit_plan_segments'
        and column_name = 'edit_plan_version_id'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'edit_plan_segments'
        and column_name = 'segment_order'
    )
    and to_regclass('public.idx_edit_plan_segments_plan_order') is null
  then
    create index idx_edit_plan_segments_plan_order
      on public.edit_plan_segments(edit_plan_version_id, segment_order);
  end if;
end $$;
create index if not exists idx_edit_operations_segment_order on public.edit_operations(edit_plan_segment_id, operation_order);

drop trigger if exists set_edit_plan_versions_updated_at on public.edit_plan_versions;
create trigger set_edit_plan_versions_updated_at before update on public.edit_plan_versions
for each row execute function public.set_updated_at();
