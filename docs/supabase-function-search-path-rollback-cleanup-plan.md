# Supabase Function Search Path Rollback and Cleanup Plan

Prompt 26F defines rollback requirements for future function search-path remediation. It does not create a rollback migration and does not alter Supabase.

Rollback plan status: `rollback_requirements_defined`.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Future Rollback Requirements

A future executable migration candidate must include or reference:

- Prior function definitions captured from source-controlled migration material or approved read-only evidence.
- Exact function signatures including argument types and parameter names.
- Security mode, volatility, owner expectations, grants, and trigger dependencies.
- A restoration plan that returns each function to the prior definition without dropping dependent policies, triggers, or tables.
- Local rollback validation before any staging rollback packet is approved.
- Staging rollback ownership, timing, and evidence requirements before staging execution.

## Cleanup Requirements

- Remove only temporary local validation fixtures created by the future prompt.
- Do not remove production/staging data.
- Do not rotate or fetch secrets in this migration family.
- Do not alter grants, owners, policies, indexes, storage, credit tables, jobs, providers, or runtime routes unless separately approved.

## Function Scope

Rollback coverage must include `can_claim_worker_job`, `can_start_generation`, `prevent_approved_plan_snapshot_immutable_update`, `can_run_job`, `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, `e2e_jsonb_has_secret_like_content`, `e2e_assert_safe_json`, and `e2e_json_contains_secret_marker`.
