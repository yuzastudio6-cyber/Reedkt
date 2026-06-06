# Function Search Path Draft SQL Sketch

DRAFT ONLY — DO NOT EXECUTE.
NOT AN ACTIVE MIGRATION.
This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future fixed-search-path remediation for mutable function search-path findings:

- `can_claim_worker_job`
- `can_start_generation`
- `prevent_approved_plan_snapshot_immutable_update`
- `can_run_job`
- `can_create_approved_plan_snapshot`
- `active_worker_claim_exists`
- `e2e_jsonb_has_secret_like_content`
- `e2e_assert_safe_json`
- `e2e_json_contains_secret_marker`

## Review-Only Sketch

```sql
-- DRAFT ONLY — DO NOT EXECUTE
-- NOT AN ACTIVE MIGRATION
-- not validated
-- not applied to Supabase
-- requires future prompt
-- Future prompt must preserve function name, argument types, parameter names,
-- return type, security mode, volatility, owner expectations, and grants.
-- Future prompt must use fixed search_path plus schema-qualified references.

-- Candidate review-only shape, not runnable:
-- create or replace function public.<function_name>(<preserve_existing_args>)
-- returns <preserve_existing_return_type>
-- language <preserve_existing_language>
-- <preserve_existing_security_mode>
-- set search_path = ''
-- as $function$
-- begin
--   -- Use schema-qualified references such as public.<table> and auth.<helper>.
--   -- Preserve behavior; do not change grants, owners, security mode, or
--   -- RLS policy behavior in the search-path-only candidate.
-- end;
-- $function$;

-- The placeholder above is not executable SQL and is not an active migration.
```

## Non-Execution Notes

No function definition is changed by Prompt 26F. No staging or production validation is claimed. No active file under `supabase/migrations/` is added or changed for this function search-path planning scope.
