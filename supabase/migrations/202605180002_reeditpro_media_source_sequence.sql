-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility guard for older active baselines where public.media_assets
-- already exists with processing_status but not the newer text status column.
alter table public.media_assets
  add column if not exists status text not null default 'uploaded';

do $reeditpro_media_assets_status_compatibility$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media_assets'
      and column_name = 'processing_status'
  ) then
    update public.media_assets
    set status = processing_status::text
    where status = 'uploaded'
      and processing_status is not null;
  end if;
end
$reeditpro_media_assets_status_compatibility$;

comment on column public.media_assets.status is
'Compatibility status column for RP-DATA-04 media source sequence indexes. Backfilled from processing_status when the older active baseline table is present.';

create table if not exists public.uploaded_clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  uploaded_order integer not null,
  source_role text,
  user_notes text,
  is_important boolean not null default false,
  is_optional boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_sequence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  uploaded_clip_id uuid not null references public.uploaded_clips(id) on delete cascade,
  source_order integer not null,
  confirmed_order integer,
  user_confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clip_analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  uploaded_clip_id uuid not null references public.uploaded_clips(id) on delete cascade,
  analysis_version integer not null default 1,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.media_assets is 'Project-scoped media metadata. Source media and browser capture artifacts are private by default.';
comment on table public.uploaded_clips is 'Uploaded clips preserve source/story order context, not automatic final edit order.';
comment on table public.source_sequence_items is 'Source sequence confirmations must happen before approval when multiple clips are involved.';
comment on table public.clip_analysis_snapshots is 'Future analysis snapshots are worker/service generated; no real analysis is run by this migration.';

create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status);
create index if not exists idx_uploaded_clips_project_order on public.uploaded_clips(project_id, uploaded_order);
create index if not exists idx_source_sequence_session_confirmed on public.source_sequence_items(edit_session_id, confirmed_order);
create index if not exists idx_source_sequence_project_order on public.source_sequence_items(project_id, source_order);
create index if not exists idx_clip_analysis_clip_version on public.clip_analysis_snapshots(uploaded_clip_id, analysis_version);

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at before update on public.media_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_uploaded_clips_updated_at on public.uploaded_clips;
create trigger set_uploaded_clips_updated_at before update on public.uploaded_clips
for each row execute function public.set_updated_at();

drop trigger if exists set_source_sequence_items_updated_at on public.source_sequence_items;
create trigger set_source_sequence_items_updated_at before update on public.source_sequence_items
for each row execute function public.set_updated_at();
