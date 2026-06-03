# Local-Only SQL Test Rules

This directory is the only SQL directory that `scripts/validation/local-supabase-rls-runner.mjs` may execute.

Prompt 20 does not add executable SQL files here because the local Supabase toolchain is blocked.

Prompt 20A keeps this directory list/dry-run only. It adds local Supabase config and hardens the runner, but does not add executable SQL because the Supabase CLI is still the wrong architecture, `psql` is still missing, and no verified local DB URL exists.

Prompt 20C keeps this directory list/dry-run only. It adds manual setup docs and clearer runner/preflight guidance, but does not add executable SQL because the local environment still lacks an arm64-compatible Supabase CLI, `psql`, a verified local DB URL, and a reviewed first local SQL candidate.

Prompt 20D keeps this directory list/dry-run only. It verifies Docker is reachable, makes dry-run status-free by default, and records `canProceedToPrompt20B=false` because the Supabase CLI is still wrong-architecture, `psql` is missing, no localhost-only local DB URL is verified, and the first local SQL candidate is still absent.

Prompt 20E keeps this directory list/dry-run only. It adds a manual-only host toolchain probe and records the same SQL blockers: wrong-architecture Supabase CLI, missing `psql`, no localhost-only local DB URL, and no local SQL candidate.

Prompt 20F keeps this directory list/dry-run only. It verifies manual host repair has not happened and records the current blockers: wrong-architecture Supabase CLI, Docker daemon unavailable to this process, missing `psql`, no localhost-only local DB URL, and no local SQL candidate.

## No Remote Rule

Never run files in this directory against:

- staging Supabase
- remote Supabase
- production Supabase
- linked Supabase projects
- databases containing production data
- databases containing private media, provider payloads, service-role keys, signed URLs, Stripe data, or raw user PII

## Runner Commands

List tests:

```sh
npm run supabase:rls:list-tests
```

Run dry-run:

```sh
npm run supabase:rls:local:dry-run
```

Run selected local-only executable tests only after preflight passes:

```sh
npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/<test-file>.sql
```

## Fixture Strategy

Executable local SQL must use synthetic, resettable fixtures only:

- synthetic users
- synthetic profiles
- synthetic workspaces
- synthetic workspace memberships
- synthetic projects
- test-run-scoped identifiers

No fixture may include private media, signed URLs, provider keys, service-role keys, Stripe data, raw PII, production data, or real provider request IDs.

## Cleanup Strategy

Prefer transaction rollback. If a test intentionally checks append-only or immutable behavior, document why rollback is insufficient and require disposable local database reset.

Cleanup must be scoped to synthetic fixture IDs only.

## Draft-To-Executable Rules

A draft SQL file may become executable only when:

- local Supabase target is proven local and isolated
- `supabase/config.toml` exists and is safe
- Supabase CLI architecture is compatible or an approved local container path exists
- Docker/local runtime is available if required
- `psql` or an approved local SQL executor is available
- migration reset/application succeeds locally
- role simulation and `auth.uid()` behavior are explicit
- canonical table targets are verified
- cleanup is explicit
- evidence capture is defined

## Current Executable Test List

None.

## Current Draft-Only Test List

- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`
- `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql`
- `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql`
- `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql`
- `database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql`
- `database/test-sql/011_media_readiness_probe_timing_rls_smoke_tests.draft.sql`
- `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql`
- `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql`
- `database/test-sql/014_tool_call_foundation_rls_smoke_tests.draft.sql`
- `database/test-sql/015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql`
- `database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql`
- `database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql`
- `database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql`
- `database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql`
- `database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql`

## Known Blockers

- Local Supabase CLI is x86_64 and fails on this arm64 host with error `-86`.
- `supabase/config.toml` exists and is local-only after Prompt 20A.
- Docker daemon was reachable in earlier prompts but is unavailable to this process during Prompt 20F verification.
- `psql` is not on PATH.
- No local Supabase database URL is verified.
- No executable local-only SQL file exists yet.
- Prompt 20F recommends Prompt 20F1 - Manual Host Tool Repair Follow-Up before Prompt 20B unless preflight or host probe reports `canProceedToPrompt20B=true`.
