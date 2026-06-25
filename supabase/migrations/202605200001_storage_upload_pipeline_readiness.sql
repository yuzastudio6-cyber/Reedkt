-- RP-FIX-07: Storage upload pipeline readiness.
-- Local-only migration. Do not run against production until local/staging tests pass.
-- This keeps existing RP-DATA-04 bucket ids and adds conservative policies for the
-- workspace/{workspace_id}/project/{project_id}/... object path convention.

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

drop policy if exists "reeditpro_project_members_read_workspace_project_objects" on storage.objects;
create policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects
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
  and (storage.foldername(name))[1] = 'workspace'
  and (storage.foldername(name))[3] = 'project'
  and public.is_project_member(public.safe_uuid((storage.foldername(name))[4]))
);

drop policy if exists "reeditpro_project_editors_upload_workspace_source_and_thumbnails" on storage.objects;
create policy "reeditpro_project_editors_upload_workspace_source_and_thumbnails" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('source-media', 'thumbnails')
  and (storage.foldername(name))[1] = 'workspace'
  and (storage.foldername(name))[3] = 'project'
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[4]))
);

drop policy if exists "reeditpro_project_editors_update_workspace_source_and_thumbnails" on storage.objects;
create policy "reeditpro_project_editors_update_workspace_source_and_thumbnails" on storage.objects
for update to authenticated
using (
  bucket_id in ('source-media', 'thumbnails')
  and (storage.foldername(name))[1] = 'workspace'
  and (storage.foldername(name))[3] = 'project'
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[4]))
)
with check (
  bucket_id in ('source-media', 'thumbnails')
  and (storage.foldername(name))[1] = 'workspace'
  and (storage.foldername(name))[3] = 'project'
  and public.is_project_editor(public.safe_uuid((storage.foldername(name))[4]))
);

-- RP-FIX-07 read policy for workspace/{workspace_id}/project/{project_id}/...
-- paths. Reads require project membership.
-- RP-FIX-07 direct browser uploads are limited to source-media and thumbnails
-- for project editors.

-- Generated assets, preview renders, final exports, QA artifacts, and worker-temp writes
-- should be created by future backend workers or signed upload routes.
-- Profile and brand asset paths are workspace-only in the app helpers:
-- workspace/{workspace_id}/profile/{user_id}/{filename}
-- workspace/{workspace_id}/brand/{asset_id}/{filename}
-- No direct browser policy is added for those workspace-only paths in this migration
-- because membership checks cannot be proven from a project id segment.
-- No anonymous policy is created and no bucket is public by default.
