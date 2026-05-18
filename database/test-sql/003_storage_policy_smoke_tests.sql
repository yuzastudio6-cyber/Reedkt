-- ReeditPro manual SQL test file.
-- Do not run in production.
-- Use only in local/staging Supabase testing.
-- Created by RP-DATA-04.

-- Storage policy smoke-test checklist.
-- 1. Confirm all ReeditPro buckets are private: source-media, generated-assets, processed-media, previews, exports, thumbnails, qa-artifacts, worker-temp.
-- 2. Upload a source-media object under <project_id>/source/<file_name> as a project member/editor.
-- 3. Confirm the same project member can read the object through authenticated policy or signed URL flow.
-- 4. Confirm another workspace member cannot read the object.
-- 5. Confirm worker-temp has no normal user read/write policy.
-- 6. Confirm qa-artifacts are private and project-scoped.
-- 7. Confirm no anonymous/public bucket policy exposes source media or browser capture artifacts.

-- Object path conventions are environment-specific and should be tested locally/staging first.
