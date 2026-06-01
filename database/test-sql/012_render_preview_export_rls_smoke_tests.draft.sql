-- Prompt 10 render/preview/export RLS smoke tests.
-- Draft/local-staging validation only.
-- Do not run against production.
-- Do not run until the Supabase CLI/local validation environment is repaired.
-- Do not add credentials, signed URLs, service-role keys, provider keys, or private media.
--
-- Scope:
--   Allowed tables: profiles/workspaces/workspace_members/projects as access context,
--   approved_plan_snapshots, credit_estimates, credit_reservations, media_assets,
--   storage_object_records, master_timing_maps, render_jobs, render_job_inputs,
--   renders, render_events, final_exports, qa_reports, qa_check_results, audit_events.
--   Blocked actions: provider calls, worker execution, Remotion/FFmpeg execution,
--   storage uploads/downloads, credit mutation, and production migrations.

begin;

-- TODO(local-fixture): create isolated test users/workspaces/projects in a local Supabase reset.
-- TODO(local-fixture): seed approved snapshot, approved credit estimate, active reservation,
-- source media/storage references, timing reference, QA records, render records, and final export records.

-- 1. Workspace member can read project-scoped render records.
-- set local role authenticated;
-- set request.jwt.claim.sub = '<member-user-id>';
-- select id from renders where project_id = '<member-project-id>';

-- 2. Non-member cannot read project-scoped render records.
-- set request.jwt.claim.sub = '<non-member-user-id>';
-- select throws/no rows from renders where project_id = '<member-project-id>';

-- 3. Normal user cannot mutate render job execution state directly.
-- insert into render_jobs (...) values (...) should fail under anon/authenticated RLS.
-- update render_jobs set status = 'running' where id = '<render-job-id>' should fail.

-- 4. Backend/service-role creates render jobs in a future migration/runtime prompt only.
-- This draft does not execute service-role writes.

-- 5. Render job must reference approved snapshot and active credit reservation when credits apply.
-- Future assertion should verify FKs/checks once schema cleanup is complete.

-- 6. Render input records cannot cross workspace/project boundaries.
-- Future assertion should reject render_job_inputs pointing to media/storage outside the project.

-- 7. Render events are append-only.
-- Future assertion should ensure normal users cannot update/delete render_events.

-- 8. Preview/final render output records remain private.
-- Future assertion should verify storage bucket/path policies do not expose source or export artifacts.

-- 9. Final exports are blocked when QA blockers exist.
-- Future assertion should verify final_exports cannot be marked completed with blocking qa_reports.

-- 10. No signed URLs, provider keys, service-role data, or raw secrets are stored in JSONB.
-- Future assertion should scan render/export metadata fields for forbidden keys.

rollback;
