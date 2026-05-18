-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: source media, uploaded clip metadata, source sequence confirmation, and future analysis snapshots.

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  asset_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  duration_seconds numeric,
  width integer,
  height integer,
  size_bytes bigint,
  status text not null default 'uploaded',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table media_assets is 'Draft project-scoped media asset table. Source media should be private by default and served through signed URLs later.';

create table if not exists uploaded_clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  uploaded_order integer not null,
  source_role text,
  user_notes text,
  is_important boolean not null default false,
  is_optional boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

comment on table uploaded_clips is 'Draft uploaded clip table. Uploaded order is source/story context, not automatic final edit order.';

create table if not exists source_sequence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  uploaded_clip_id uuid not null references uploaded_clips(id) on delete cascade,
  source_order integer not null,
  confirmed_order integer,
  user_confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table source_sequence_items is 'Draft source sequence table. Source order confirmation must happen before approved snapshot execution.';

create table if not exists clip_analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  uploaded_clip_id uuid not null references uploaded_clips(id) on delete cascade,
  analysis_version integer not null default 1,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table clip_analysis_snapshots is 'Draft future analysis snapshot table. RP-DATA-02 does not implement media analysis.';

create index if not exists idx_media_assets_project_id on media_assets(project_id);
create index if not exists idx_uploaded_clips_project_order on uploaded_clips(project_id, uploaded_order);
create index if not exists idx_source_sequence_items_session_order on source_sequence_items(edit_session_id, confirmed_order);
create index if not exists idx_clip_analysis_snapshots_clip_id on clip_analysis_snapshots(uploaded_clip_id);
