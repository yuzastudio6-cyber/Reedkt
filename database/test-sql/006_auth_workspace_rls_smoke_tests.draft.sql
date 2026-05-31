-- ReeditPro Prompt 3 draft SQL/RLS smoke test plan.
-- Do not run in production.
-- Use only in a disposable local Supabase project or explicitly approved staging validation.
-- This file is intentionally a draft because Prompt 2A still requires schema-era cleanup.

-- Allowed Prompt 3 tables only:
-- - auth.users
-- - public.profiles
-- - public.workspaces
-- - public.workspace_members
-- - public.projects
-- - public.audit_events only if a later prompt explicitly scopes sanitized append-only auth/workspace audit events

-- Blocked in this Prompt 3 file:
-- - user_profiles
-- - chat/media/storage/planning/credit/job/worker/provider/render/tool/SFX/StoryTiming tables
-- - any schema-changing migration
-- - any remote Supabase execution

-- Fixture setup to prepare manually in local Supabase:
-- 1. Create disposable auth users user_a, user_b, and user_c.
-- 2. Create a workspace owned by user_a.
-- 3. Create workspace_members rows:
--    - user_a as owner
--    - user_b as editor or viewer
--    - no row for user_c
-- 4. Create a project in user_a workspace with owner_id = user_a.
-- 5. Run each select/insert/update case using the relevant authenticated JWT.

-- Smoke cases to convert to executable SQL after local fixture IDs exist:
-- APW-RLS-01: user_a can select own public.profiles row.
-- APW-RLS-02: user_a cannot select user_b private profile row.
-- APW-RLS-03: user_a can insert public.profiles only with user_id = auth.uid().
-- APW-RLS-04: user_a cannot insert public.profiles for user_b.
-- APW-RLS-05: user_a can update safe own profile fields.
-- APW-RLS-07: user_a can select own public.workspaces row.
-- APW-RLS-08: user_b can select assigned workspace.
-- APW-RLS-09: user_c cannot select the workspace.
-- APW-RLS-11: user_b cannot create privileged membership for user_c.
-- APW-RLS-12: user_b cannot assign themselves owner/admin.
-- APW-RLS-15: user_a and user_b can select projects in the assigned workspace.
-- APW-RLS-16: user_c cannot select projects in the workspace.
-- APW-RLS-17: project access follows public.projects.workspace_id -> public.workspace_members.workspace_id.

-- Expected API-adjacent checks after server route tests are available:
-- - POST /v1/auth/profile/ensure returns safe profile summary.
-- - POST /v1/auth/workspace/ensure returns safe workspace and membership summaries.
-- - POST /v1/workspaces/membership/check returns access for user_a/user_b and denies user_c.
-- - POST /v1/projects/access/check returns access for user_a/user_b and denies user_c.
-- - POST /v1/projects fails closed in Prompt 3.

-- TODO(Prompt 3A or later): replace this draft with executable local-only SQL once fixture creation and
-- schema-era cleanup are settled.
