# Prompt 26F - Function Search Path Hardening Migration Plan

## Implementation Record

- Branch: `codex/rp-foundation-26f-function-search-path-hardening-migration-plan`
- Base: `origin/codex/rp-foundation-26e3-local-rls-candidate-toolchain-schema-follow-up`
- PR: pending
- Status: open / pending validation
- Production capability enabled: none; function search_path hardening migration plan only

## Scope

Prompt 26F creates docs, draft-only SQL Markdown, diagnostics, and tracker updates for future mutable function `search_path` hardening. It plans from Prompt 26A supplied connected read-only findings only and does not inspect or fetch live Supabase function definitions.

## Functions Covered

- `can_claim_worker_job`
- `can_start_generation`
- `prevent_approved_plan_snapshot_immutable_update`
- `can_run_job`
- `can_create_approved_plan_snapshot`
- `active_worker_claim_exists`
- `e2e_jsonb_has_secret_like_content`
- `e2e_assert_safe_json`
- `e2e_json_contains_secret_marker`

## Non-Execution Boundaries

No Supabase lifecycle/status command, SQL, raw `psql`, migration deployment, active migration creation, function alteration, Google Cloud API, Secret Manager API, deployment, provider call, tool execution, worker execution, rendering/export, media/storage/credit/Stripe command, external telemetry, human approval grant, staging approval, production readiness approval, or beta/production unlock is enabled.

## Validation

Validation commands and results are recorded in `docs/prompt-26f-validation-results.md`.
