-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-media', 'source-media', false, null, null),
  ('generated-assets', 'generated-assets', false, null, null),
  ('processed-media', 'processed-media', false, null, null),
  ('previews', 'previews', false, null, null),
  ('exports', 'exports', false, null, null),
  ('thumbnails', 'thumbnails', false, null, null),
  ('qa-artifacts', 'qa-artifacts', false, null, null),
  ('worker-temp', 'worker-temp', false, null, null)
on conflict (id) do update
set public = false,
    name = excluded.name;

comment on table storage.buckets is 'ReeditPro buckets are private by default. Object paths should start with <project_id>/... for project-scoped access.';

drop policy if exists "reeditpro_project_members_read_project_objects" on storage.objects;
create policy "reeditpro_project_members_read_project_objects" on storage.objects
for select to authenticated
using (
  bucket_id in (
    'source-media',
    'generated-assets',
    'processed-media',
    'previews',
    'exports',
    'thumbnails',
    'qa-artifacts'
  )
  and public.is_project_member(public.safe_uuid((storage.foldername(name))[1]))
);

drop policy if exists "reeditpro_project_editors_upload_source_and_thumbnails" on storage.objects;
create policy "reeditpro_project_editors_upload_source_and_thumbnails" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('source-media', 'thumbnails')
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[1]))
);

drop policy if exists "reeditpro_project_editors_update_source_and_thumbnails" on storage.objects;
create policy "reeditpro_project_editors_update_source_and_thumbnails" on storage.objects
for update to authenticated
using (
  bucket_id in ('source-media', 'thumbnails')
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[1]))
)
with check (
  bucket_id in ('source-media', 'thumbnails')
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[1]))
);

comment on policy "reeditpro_project_members_read_project_objects" on storage.objects is
  'Reads are project-scoped by first path segment. Previews and exports still use private buckets and should prefer signed URLs in the app.';
comment on policy "reeditpro_project_editors_upload_source_and_thumbnails" on storage.objects is
  'Initial testing allows authenticated project editors to upload source media and thumbnails only.';

-- No normal user policy is created for worker-temp. Backend workers should use service role only.
-- No anonymous policy is created. Source media, browser capture artifacts, generated assets, QA artifacts, previews, and exports remain private.
-- Object path convention: <project_id>/<asset_type_or_folder>/<file_name>.
-- Future signed URL logic belongs in backend/application code, not this migration.
