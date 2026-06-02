# Database Test SQL

This directory contains manual SQL/RLS smoke-test plans for ReeditPro. These files are not production migration files.

## Current Status

- Files `001` through `005` are legacy manual local/staging SQL smoke checklists.
- Files `006` through `020` are draft-only Prompt 3-18 SQL/RLS plans.
- None of these files is proof that RLS passed.
- Prompt 19 does not run SQL, Supabase CLI, local Supabase, staging Supabase, or remote Supabase.
- Prompt 20 adds local-only safety preflight and a guarded RLS list/dry-run runner, but does not run SQL because the local Supabase toolchain is blocked.
- Do not run in production.

## No Production Execution Rule

Do not run these files against production data, production Supabase, linked remote projects, or any environment containing customer/private media. Do not add credentials, service-role keys, provider keys, Stripe keys, signed URLs, private media, raw PII, or raw secrets to these files.

## How Draft Files Become Executable

Draft SQL becomes executable only through the review path in `docs/rls-draft-to-executable-conversion-plan.md`. A future prompt must verify local Supabase architecture, fixture design, cleanup strategy, role simulation, canonical schema targets, and evidence capture before renaming or running a file.

## Current File List

- `001_rls_smoke_tests.sql`
- `002_approved_snapshot_immutability_tests.sql`
- `003_storage_policy_smoke_tests.sql`
- `004_credit_audit_append_only_tests.sql`
- `005_e2e_runtime_readiness_smoke_tests.sql`
- `006_auth_workspace_rls_smoke_tests.draft.sql`
- `007_storage_upload_rls_smoke_tests.draft.sql`
- `008_approved_snapshot_rls_smoke_tests.draft.sql`
- `009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql`
- `010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql`
- `011_media_readiness_probe_timing_rls_smoke_tests.draft.sql`
- `012_render_preview_export_rls_smoke_tests.draft.sql`
- `013_qa_revision_fallback_rls_smoke_tests.draft.sql`
- `014_tool_call_foundation_rls_smoke_tests.draft.sql`
- `015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql`
- `016_worker_claim_execution_contract_rls_smoke_tests.draft.sql`
- `017_provider_gateway_rls_smoke_tests.draft.sql`
- `018_compliance_license_security_review_rls_smoke_tests.draft.sql`
- `019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql`
- `020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql`

## Manifest Reference

Use `docs/supabase-rls-test-manifest.md` as the Prompt 19 inventory for domain coverage, fixture requirements, cleanup requirements, risks, conversion notes, and owner milestones.

## Future Path

Prompt 20 should run local Supabase/RLS validation only after Prompt 19 preparation diagnostics pass and the local Supabase environment is confirmed safe. Staging validation requires separate human approval.

Prompt 20 result: local SQL/RLS execution remains blocked by missing `supabase/config.toml`, wrong-architecture Supabase CLI error `-86`, unavailable Docker daemon, missing `psql`, no verified local database URL, and no executable local-only SQL candidates. Use `database/test-sql/local/README.md` for the future local-only runner path.
