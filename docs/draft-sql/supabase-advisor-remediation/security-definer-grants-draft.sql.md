# SECURITY DEFINER Grants Draft SQL Sketch

DRAFT ONLY — DO NOT EXECUTE.
NOT AN ACTIVE MIGRATION.
This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future function/grant review for SECURITY DEFINER findings. This is Markdown review material only, not executable SQL:

- `has_workspace_role`
- `is_workspace_owner_or_admin`
- `is_workspace_owner_record`
- `set_updated_at`
- `can_export_render`
- `is_project_editor`
- `is_project_member`

## Review-Only Sketch

```sql
-- DRAFT ONLY — DO NOT EXECUTE.
-- NOT AN ACTIVE MIGRATION.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- Future prompt must inspect function bodies, owners, current grants, and policy dependencies.

-- Candidate review outcomes:
-- 1. preserve each function signature, argument types, and parameter names;
-- 2. review execute grants for anon, authenticated, and backend/service-role paths;
-- 3. consider revoke execute from anon only after dependency review;
-- 4. preserve authenticated helper access only when RLS policy or RPC evidence proves it is required;
-- 5. consider SECURITY INVOKER only after body and behavior tests prove definer privileges are unnecessary;
-- 6. add fixed search path and schema-qualified references in a paired reviewed function migration.

-- No revoke, grant, alter function, or create function statement is approved here.
```

## Non-Execution Notes

No function or grant is changed by Prompt 26G. No staging or production validation is claimed.
