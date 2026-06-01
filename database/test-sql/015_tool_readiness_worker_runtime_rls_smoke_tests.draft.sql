-- Prompt 13 draft-only RLS smoke tests for future tool readiness and worker runtime records.
-- DO NOT RUN in production. This file is documentation for future local/staging validation.
--
-- Scope:
-- - tool readiness records
-- - tool runtime requirements
-- - worker runtime status
-- - tool call plans
-- - tool call results
-- - no cross-user access
-- - no service role exposure
-- - no mutation by normal users
--
-- Expected future tables:
-- - tool_readiness_records
-- - tool_runtime_requirements
-- - worker_runtime_status
-- - tool_call_intents
-- - tool_call_executions
--
-- Future fixture assumptions:
-- - user_a is a member of workspace_a/project_a.
-- - user_b is not a member of workspace_a/project_a.
-- - service-role checks are executed only by trusted backend test harnesses.

begin;

-- 1. Normal users may read sanitized readiness records only for their workspace/project context.
-- select ok(count(*) >= 0, 'workspace member can read sanitized tool readiness records')
-- from tool_readiness_records
-- where workspace_id = :'workspace_a';

-- 2. Normal users must not read another workspace/project readiness records.
-- select is_empty(
--   $$ select 1 from tool_readiness_records where workspace_id = :'workspace_b' $$,
--   'non-member cannot read cross-workspace tool readiness records'
-- );

-- 3. Normal users must not mutate tool readiness records.
-- insert into tool_readiness_records (workspace_id, tool_id, readiness_state)
-- values (:'workspace_a', 'ffmpeg', 'ready_for_future_activation');
-- -- expect RLS violation

-- 4. Normal users must not mutate worker runtime status.
-- update worker_runtime_status
-- set status = 'ready'
-- where workspace_id = :'workspace_a';
-- -- expect RLS violation

-- 5. Tool call plans/results remain workspace/project scoped and never expose service role secrets.
-- select is_empty(
--   $$ select 1 from tool_call_executions where secret_metadata::text ilike '%service_role%' $$,
--   'tool call execution records do not expose service role material'
-- );

-- 6. Signed URLs must not be stored as source of truth.
-- select is_empty(
--   $$ select 1 from tool_call_executions where result_metadata::text ilike '%signed%url%' $$,
--   'tool call results do not persist signed URLs as source of truth'
-- );

rollback;
