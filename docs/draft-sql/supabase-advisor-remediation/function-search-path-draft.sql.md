# Function Search Path Draft SQL Sketch

DRAFT ONLY. DO NOT EXECUTE. This sketch is not validated, not applied to Supabase, and requires future prompt.

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
-- DRAFT ONLY. DO NOT EXECUTE.
-- Not validated. Not applied to Supabase. Requires future prompt.
-- Future prompt must preserve signatures and review dependencies first.

-- Candidate pattern only:
-- create or replace function public.example_function(...)
-- returns ...
-- language plpgsql
-- security definer
-- set search_path = public, auth
-- as $$
-- begin
--   -- Body must use schema-qualified references after review.
-- end;
-- $$;

-- The placeholder above is not an executable remediation.
```

## Non-Execution Notes

No function definition is changed by Prompt 26C. No staging or production validation is claimed.
