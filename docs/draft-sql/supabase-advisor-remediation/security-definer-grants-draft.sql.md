# SECURITY DEFINER Grants Draft SQL Sketch

DRAFT ONLY. DO NOT EXECUTE. This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future function/grant review for SECURITY DEFINER findings:

- `has_workspace_role`
- `is_workspace_owner_or_admin`
- `is_workspace_owner_record`
- `set_updated_at`
- `can_export_render`
- `is_project_editor`
- `is_project_member`

## Review-Only Sketch

```sql
-- DRAFT ONLY. DO NOT EXECUTE.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- Future prompt must inspect function bodies, owners, current grants, and policy dependencies.

-- Candidate review outcomes:
-- 1. keep SECURITY DEFINER and restrict execute grants;
-- 2. convert to SECURITY INVOKER only when policy semantics remain correct;
-- 3. preserve trigger helper direct use while removing unnecessary callable grants;
-- 4. add fixed search path in a paired reviewed function migration.

-- No revoke, grant, alter function, or create function statement is approved here.
```

## Non-Execution Notes

No function or grant is changed by Prompt 26C. No staging or production validation is claimed.
