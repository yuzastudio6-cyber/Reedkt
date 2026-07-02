-- ReeditPro manual SQL test file.
-- Do not run in production.
-- Use only in local/staging Supabase testing.
-- Created by RP-DATA-04.

-- RLS smoke-test checklist.
-- 1. Create auth user A and auth user B in a local/staging Supabase project.
-- 2. Create workspace A owned by user A and workspace B owned by user B.
-- 3. Confirm user A can select only workspace A, its projects, sessions, chat, media, plans, jobs, QA, and exports.
-- 4. Confirm user B cannot select workspace A rows.
-- 5. Confirm project membership grants visibility only after workspace_members includes the user.
-- 6. Confirm normal users cannot insert/update worker-owned tables such as job_steps, worker_events, generation_events, credit_ledger_entries, and audit_events.
-- 7. Confirm approved_plan_snapshots have no normal user update/delete path.

-- Environment-specific SQL should be written during local/staging testing after auth fixture IDs exist.
