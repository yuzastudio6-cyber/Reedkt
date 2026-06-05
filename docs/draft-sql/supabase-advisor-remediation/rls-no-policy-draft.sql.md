# RLS No-Policy Draft SQL Sketch

DRAFT ONLY — DO NOT EXECUTE. NOT AN ACTIVE MIGRATION. This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future policy contract options for RLS-enabled/no-policy tables from Prompt 26D and Prompt 26E:

- `activation_artifacts`
- `activation_qa_gates`
- `activation_runs`
- `feature_gates`
- `readiness_snapshots`
- `tool_capabilities`

## Review-Only Sketch

```sql
-- DRAFT ONLY — DO NOT EXECUTE.
-- NOT AN ACTIVE MIGRATION.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- This sketch is review material only and must not be copied into psql,
-- Supabase SQL editor, supabase/migrations, or staging/production.

-- Prompt 26D/26E classification placeholders:
-- activation_artifacts: backend_service_role_only
-- activation_qa_gates: backend_service_role_only
-- activation_runs: backend_service_role_only
-- feature_gates: no_client_access
-- readiness_snapshots: backend_service_role_only
-- tool_capabilities: no_client_access

-- Future policy-name placeholders from Prompt 26E:
-- activation_artifacts_select_backend_only
-- activation_qa_gates_select_backend_only
-- activation_runs_select_backend_only
-- feature_gates_select_no_client_access
-- readiness_snapshots_select_backend_only
-- tool_capabilities_select_no_client_access

-- Future executable SQL must be generated only after:
-- 1. table columns are confirmed;
-- 2. grants are reviewed;
-- 3. helper functions are reviewed;
-- 4. indexes are reviewed;
-- 5. local validation is approved by a later prompt;
-- 6. staging gates are satisfied for any staging execution.
```

## Non-Execution Notes

No policy is created by Prompt 26C or Prompt 26E. No staging or production validation is claimed.

## Future Review Checklist

- Confirm all six tables still exist and still have RLS enabled.
- Confirm exact columns, grants, helper functions, and indexes before any SQL is written.
- Confirm `anon`, `authenticated`, and `service_role` behavior separately.
- Confirm future SQL uses explicit `TO` role targeting.
- Confirm no raw secrets, project refs, signed URLs, provider keys, Stripe keys, private media, or production rows are present.
