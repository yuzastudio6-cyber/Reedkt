# RLS No-Policy Draft SQL Sketch

DRAFT ONLY. DO NOT EXECUTE. This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future policy contract options for RLS-enabled/no-policy tables:

- `activation_artifacts`
- `activation_qa_gates`
- `activation_runs`
- `feature_gates`
- `readiness_snapshots`
- `tool_capabilities`

## Review-Only Sketch

```sql
-- DRAFT ONLY. DO NOT EXECUTE.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- Future prompt must classify each table before creating any policy.

-- Example classification placeholders:
-- activation_artifacts: deny_all or project_member_read
-- activation_qa_gates: deny_all or project_member_read
-- activation_runs: deny_all or project_member_read
-- feature_gates: authenticated_static_read or service_only
-- readiness_snapshots: workspace_member_read or service_only
-- tool_capabilities: authenticated_static_read or service_only

-- Future executable SQL must be generated only after:
-- 1. table columns are confirmed;
-- 2. grants are reviewed;
-- 3. helper functions are reviewed;
-- 4. local validation is approved by a later prompt.
```

## Non-Execution Notes

No policy is created by Prompt 26C. No staging or production validation is claimed.
