-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: compiled intent, settings snapshots, edit plan versions, plan components, segments, and worker-ready operations.

create table if not exists edit_intent_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
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
  created_at timestamptz not null default now()
);

comment on table edit_intent_snapshots is 'Draft versioned intent table. Raw chat is compiled into structured intent before planning.';

create table if not exists edit_settings_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  intent_snapshot_id uuid references edit_intent_snapshots(id) on delete set null,
  settings_json jsonb not null default '{}'::jsonb,
  source_order_confirmed boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

comment on table edit_settings_snapshots is 'Draft settings snapshot table for frame, level, source order, and user-confirmed setup state.';

create table if not exists edit_plan_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  intent_snapshot_id uuid references edit_intent_snapshots(id) on delete set null,
  version integer not null,
  status text not null default 'draft',
  goal_summary text,
  plan_summary_json jsonb not null default '{}'::jsonb,
  full_plan_json jsonb not null default '{}'::jsonb,
  credit_estimate_id uuid,
  approval_required boolean not null default true,
  approved_at timestamptz,
  approved_by uuid,
  superseded_by_plan_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table edit_plan_versions is 'Draft edit plan version table. full_plan_json preserves the complete mock plan for approval and audit.';
comment on column edit_plan_versions.credit_estimate_id is 'Draft forward reference to credit_estimates; add reviewed FK after credit tables exist.';

create table if not exists plan_component_snapshots (
  id uuid primary key default gen_random_uuid(),
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete cascade,
  component_type text not null,
  component_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table plan_component_snapshots is 'Optional draft table for querying individual planning layers without over-normalizing v1.';

create table if not exists edit_plan_segments (
  id uuid primary key default gen_random_uuid(),
  edit_plan_version_id uuid not null references edit_plan_versions(id) on delete cascade,
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

comment on table edit_plan_segments is 'Draft segment table for planned edit structure and worker-ready segment context.';

create table if not exists edit_operations (
  id uuid primary key default gen_random_uuid(),
  edit_plan_segment_id uuid not null references edit_plan_segments(id) on delete cascade,
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

comment on table edit_operations is 'Draft worker-ready edit operations table. Workers should execute approved snapshots, not improvise from raw chat.';

create index if not exists idx_edit_intent_snapshots_project_version on edit_intent_snapshots(project_id, version);
create index if not exists idx_edit_plan_versions_project_version on edit_plan_versions(project_id, version);
create index if not exists idx_edit_plan_versions_session_status on edit_plan_versions(edit_session_id, status);
create index if not exists idx_plan_component_snapshots_plan_component on plan_component_snapshots(edit_plan_version_id, component_type);
create index if not exists idx_edit_plan_segments_plan_order on edit_plan_segments(edit_plan_version_id, segment_order);
create index if not exists idx_edit_operations_segment_order on edit_operations(edit_plan_segment_id, operation_order);
