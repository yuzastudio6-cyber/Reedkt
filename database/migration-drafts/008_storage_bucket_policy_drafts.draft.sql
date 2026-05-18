-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: draft Supabase Storage bucket and policy templates.
-- Storage SQL varies by Supabase setup, so these are conservative review templates only.
-- Hardening note: every bucket is private by default; reads should be signed URL or app-auth mediated.

-- All buckets private by default:
-- source-media       original uploads; never public
-- generated-assets  provider-created assets and clips; project-scoped
-- processed-media   future worker processed media; project-scoped
-- previews          preview artifacts; signed URL access later
-- exports           final exports; signed download links later
-- thumbnails        posters and thumbnails; private because they reveal source content
-- qa-artifacts      QA snapshots and evidence artifacts; private
-- worker-temp       short-retention worker intermediates; not user-readable by default
-- browser-captures  if separated later, must be private/project-scoped and redaction-aware

-- Draft bucket creation template only:
-- insert into storage.buckets (id, name, public)
-- values
--   ('source-media', 'source-media', false),
--   ('generated-assets', 'generated-assets', false),
--   ('processed-media', 'processed-media', false),
--   ('previews', 'previews', false),
--   ('exports', 'exports', false),
--   ('thumbnails', 'thumbnails', false),
--   ('qa-artifacts', 'qa-artifacts', false),
--   ('worker-temp', 'worker-temp', false)
-- on conflict (id) do nothing;

-- Draft storage policy concepts:
-- 1. Project members read files only through application-approved paths or signed URLs.
-- 2. Future backend/service role writes generated-assets, processed-media, previews, exports, thumbnails,
--    qa-artifacts, and worker-temp.
-- 3. Source media uploads are project-scoped and must never be public.
-- 4. Browser capture artifacts may contain sensitive information and should be stored privately.
-- 5. worker-temp should have short retention and no durable signed URLs.
-- 6. Exports remain private by default even if product later creates signed download links.
-- 7. Thumbnails are private/project-scoped because they can reveal source content.
-- 8. QA artifacts may include browser captures, claim notes, face/object analysis, and should stay private.

-- Draft object path convention for review:
-- <workspace_id>/<project_id>/<asset_or_job_id>/<file_name>

-- Draft read policy template only:
-- create policy "project members read private project storage"
-- on storage.objects
-- for select
-- using (
--   bucket_id in ('source-media', 'generated-assets', 'processed-media', 'previews', 'exports', 'thumbnails', 'qa-artifacts')
--   and exists (
--     select 1
--     from projects p
--     join workspace_members wm on wm.workspace_id = p.workspace_id
--     where wm.user_id = auth.uid()
--       and storage.foldername(storage.objects.name)[2] = p.id::text
--   )
-- );

-- Draft worker write policy template only:
-- Backend/service-role worker writes should be enforced outside user RLS policies.
-- Do not allow direct user writes to worker-generated buckets without backend validation.
-- Worker writes should be scoped to approved jobs and audited through worker_events/audit_events.
-- User reads should be mediated through app authorization or short-lived signed URLs.

-- Retention notes:
-- source-media, generated-assets, exports, and thumbnails follow project retention policy.
-- previews and processed-media may be pruned after revision/export windows.
-- qa-artifacts follow audit/privacy policy.
-- worker-temp should be removed aggressively after job completion.
-- browser capture artifacts should use privacy-aware retention and should not be retained longer than necessary.
