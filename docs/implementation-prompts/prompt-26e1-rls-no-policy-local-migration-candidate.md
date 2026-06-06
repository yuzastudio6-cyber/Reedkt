# Prompt 26E-1 - RLS No-Policy Local Migration Candidate

## Summary

Prompt 26E-1 creates a local-only RLS no-policy advisor remediation candidate from the Prompt 26D/26E classification and draft migration plan.

- Branch: `codex/rp-foundation-26e1-rls-no-policy-local-migration-candidate`.
- Base: `origin/codex/rp-foundation-26e-rls-no-policy-draft-migration-plan`.
- PR: [#217](https://github.com/yuzastudio6-cyber/Reedkt/pull/217).
- Exact capability enabled: none; local RLS policy candidate only.

## Scope

The prompt may add:

- one active repo migration candidate for local review;
- one local-only catalog test candidate under `database/test-sql/local/`;
- diagnostics and tracker updates.

The prompt must not touch staging, remote, or production Supabase, Google Cloud, Secret Manager, providers, workers, tools, rendering, storage transfer, credits, Stripe, telemetry, or beta/production unlocks.

## Candidate Files

- `supabase/migrations/202606060001_rls_no_policy_advisor_remediation.sql`.
- `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql`.
- `scripts/validation/supabase-rls-no-policy-local-candidate-diagnostics.mjs`.
- `docs/prompt-26e1-rls-no-policy-local-migration-candidate.md`.
- `docs/prompt-26e1-validation-results.md`.

## Tables

- `activation_artifacts`
- `activation_qa_gates`
- `activation_runs`
- `feature_gates`
- `readiness_snapshots`
- `tool_capabilities`

## Acceptance State

- Local candidate status: `local_candidate_prepared`.
- Supabase update required: docs/status only unless guarded local SQL runs.
- Supabase update status: local_candidate_prepared.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.

## Validation

Run static validation, the new local-candidate diagnostic, existing Prompt 21-26E diagnostics, local Supabase probe/preflight, and RLS list/dry-run. Run the guarded local SQL test only if preflight proves a localhost-only DB URL and `canRunLocalSql=true`.

## No-Scope Statement

No staging deployment, production deployment, staging/remote Supabase execution, production Supabase execution, remote SQL execution, migration deployment to remote, provider call, real rendering/export, tool execution, real worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, Google Cloud API call, Secret Manager API call, Secret Manager metadata fetch, Secret Manager value fetch, production/beta unlock, schema-changing production migration, dependency mutation, or broad service-role handler is enabled.
