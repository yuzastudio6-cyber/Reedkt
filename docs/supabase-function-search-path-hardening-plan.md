# Supabase Function Search Path Hardening Plan

Prompt 26A reported mutable `search_path` warnings. Prompt 26B recorded a future hardening plan, Prompt 26C created draft remediation material, and Prompt 26F now defines the migration-planning contract.

Function search path migration plan status: `function_search_path_migration_plan_created`.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Active migration files changed: no.

## Candidate Functions

| Function | Domain | Future hardening pattern | Status |
| --- | --- | --- | --- |
| `can_claim_worker_job` | worker/job runtime | Review body, qualify references, set fixed search path. | Candidate only. |
| `can_start_generation` | generation gate | Review approval/credit dependencies and set fixed search path. | Candidate only. |
| `prevent_approved_plan_snapshot_immutable_update` | approved snapshot trigger | Preserve immutability semantics and set fixed search path. | Candidate only. |
| `can_run_job` | job runtime | Qualify job/dependency references and set fixed search path. | Candidate only. |
| `can_create_approved_plan_snapshot` | snapshot approval | Qualify approval/snapshot references and set fixed search path. | Candidate only. |
| `active_worker_claim_exists` | worker claim runtime | Qualify claim/lease references and set fixed search path. | Candidate only. |
| `e2e_jsonb_has_secret_like_content` | E2E/test helper | Review whether production schema exposure is intended. | Candidate only. |
| `e2e_assert_safe_json` | E2E/test helper | Review grants and fixed search path. | Candidate only. |
| `e2e_json_contains_secret_marker` | E2E/test helper | Review grants and fixed search path. | Candidate only. |

## Future Migration Rules

- Preserve existing signatures unless a compatibility plan exists.
- Preserve parameter names, return type, volatility, owner expectations, grants, and existing `SECURITY DEFINER` or `SECURITY INVOKER` mode unless separately reviewed.
- Prefer fixed empty search path with fully schema-qualified references when body review supports it.
- Qualify schema references inside function bodies.
- Confirm no function owner or grant behavior changes accidentally.
- Validate local migration chain before staging.
- Keep service-role material backend-only and never browser-visible.
- Treat `anon`, `authenticated`, and backend/service-role behavior separately when functions are policy dependencies.

## Prompt 26F Decision

No function definition is changed in Prompt 26B.
No function definition is changed in Prompt 26F. No active migration, SQL execution, Supabase environment touch, Google Cloud access, Secret Manager access, deployment, runtime execution, staging approval, production readiness, or beta unlock is enabled.

## New Prompt 26F Planning Files

- `docs/supabase-function-search-path-migration-plan.md`
- `docs/supabase-function-search-path-signature-preservation-contract.md`
- `docs/supabase-function-search-path-schema-qualification-checklist.md`
- `docs/supabase-function-search-path-future-test-matrix.md`
- `docs/supabase-function-search-path-rollback-cleanup-plan.md`
- `docs/supabase-function-search-path-staging-evidence-requirements.md`

Recommended next prompt: `Prompt 26F-1 - Function Search Path Local Migration Candidate` or `Prompt 26G - SECURITY DEFINER Exposure Migration Plan`.
