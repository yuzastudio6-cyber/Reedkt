# FK Indexes Draft SQL Sketch

DRAFT ONLY. DO NOT EXECUTE. This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future additive index candidates for unindexed foreign-key findings.

## Review-Only Sketch

```sql
-- DRAFT ONLY. DO NOT EXECUTE.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- Future prompt must confirm table/column existence and existing index coverage.

-- Candidate examples only:
-- create index concurrently if not exists idx_api_idempotency_keys_user_id
--   on public.api_idempotency_keys(user_id);

-- create index concurrently if not exists idx_approved_plan_snapshots_approved_by_user_id
--   on public.approved_plan_snapshots(approved_by_user_id);

-- create index concurrently if not exists idx_chat_actions_workspace_id
--   on public.chat_actions(workspace_id);

-- create index concurrently if not exists idx_edit_plans_created_by_user_id
--   on public.edit_plans(created_by_user_id);

-- No index statement is approved here.
```

## Non-Execution Notes

No index is created by Prompt 26C. No staging or production validation is claimed.
