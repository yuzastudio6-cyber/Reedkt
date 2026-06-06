# Local-Only SQL Test Rules

This directory is the only SQL directory that `scripts/validation/local-supabase-rls-runner.mjs` may execute.

Prompt 20 does not add executable SQL files here because the local Supabase toolchain is blocked.

Prompt 20A keeps this directory list/dry-run only. It adds local Supabase config and hardens the runner, but does not add executable SQL because the Supabase CLI is still the wrong architecture, `psql` is still missing, and no verified local DB URL exists.

Prompt 20C keeps this directory list/dry-run only. It adds manual setup docs and clearer runner/preflight guidance, but does not add executable SQL because the local environment still lacks an arm64-compatible Supabase CLI, `psql`, a verified local DB URL, and a reviewed first local SQL candidate.

Prompt 20D keeps this directory list/dry-run only. It verifies Docker is reachable, makes dry-run status-free by default, and records `canProceedToPrompt20B=false` because the Supabase CLI is still wrong-architecture, `psql` is missing, no localhost-only local DB URL is verified, and the first local SQL candidate is still absent.

Prompt 20E keeps this directory list/dry-run only. It adds a manual-only host toolchain probe and records the same SQL blockers: wrong-architecture Supabase CLI, missing `psql`, no localhost-only local DB URL, and no local SQL candidate.

Prompt 20F keeps this directory list/dry-run only. It verifies manual host repair has not happened and records the current blockers: wrong-architecture Supabase CLI, Docker daemon unavailable to this process, missing `psql`, no localhost-only local DB URL, and no local SQL candidate.

Prompt 20B adds the first local executable SQL candidate, `001_auth_workspace_minimal_local_rls.sql`, for auth/profile/workspace/project RLS only. It remains unexecuted because local `supabase start` failed at `202605180001_reeditpro_core_workspace_projects.sql` before a localhost-only DB URL could be captured.

Prompt 20H repairs the core workspace/project migration blocker and advances local `supabase start` to `202605180002_reeditpro_media_source_sequence.sql`, where it fails on missing `public.media_assets.status`.

Prompt 20I repairs the media/source-sequence migration blocker and advances local `supabase start` to `202605180003_reeditpro_intent_plan_versions.sql`, where it fails on missing `public.edit_plan_segments.edit_plan_version_id`.

Prompt 20J repairs the intent-plan migration blocker and advances local `supabase start` to `202605180004_reeditpro_credits_approval_snapshots.sql`, where it fails on missing `public.credit_reservations.approved_plan_snapshot_id`.

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

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` - Prompt 20B/20B-Retry auth/profile/workspace/project candidate. Status: passed locally through the guarded runner in Prompt 20B-Retry after a fixture-only compatibility update for the local schema-era bridge.
- `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` - Prompt 26E-1 catalog-only RLS no-policy advisor table candidate. Status after Prompt 26E-2: blocked pending local toolchain; run only through the guarded runner after preflight proves a localhost-only DB URL and `canRunLocalSql=true`. The test intentionally fails if any of the six advisor tables are absent and does not insert fixture rows because accepted column/schema evidence is incomplete.

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

- Local Supabase CLI is available through `/tmp/reeditpro-local-bin/supabase`, version `2.104.0`.
- `supabase/config.toml` exists and is local-only after Prompt 20A.
- Docker daemon is reachable, server version `29.5.2`.
- `psql` is available through `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`, version `18.4`.
- Local `supabase start` passes after Prompt 20P2.
- Prompt 20B-Retry verified localhost DB evidence as host `127.0.0.1`, port `54330`, database `postgres`, local-only yes.
- Prompt 20B-Retry exported a localhost-only DB URL for the current shell and preflight reported `canRunLocalSql=true`.
- Prompt 20B-Retry ran `001_auth_workspace_minimal_local_rls.sql` through the guarded runner and passed.
- Broader domain RLS files remain draft-only or manual-review-only.
- Staging, remote, and production Supabase SQL remain unrun and prohibited until a later approved milestone.

## Prompt 20B-Retry Result

Prompt 20B-Retry executed exactly one local SQL file through the guarded runner:

```sh
npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/001_auth_workspace_minimal_local_rls.sql
```

The first run exposed a local schema compatibility issue in the fixture (`workspaces.metadata_json` did not exist). The SQL candidate was minimally adjusted to seed `public.user_profiles` bridge records and use the legacy-compatible `workspaces.owner_user_id` and `projects.created_by` columns while still testing Prompt 3 auth/profile/workspace/project policies. The final guarded run passed and rolled back the synthetic fixture transaction.

## Prompt 26E-1 Local Candidate

Prompt 26E-1 adds `002_rls_no_policy_advisor_tables_local.sql` as a catalog-only local SQL candidate for the six connected-advisor RLS no-policy tables:

- `activation_artifacts`
- `activation_qa_gates`
- `activation_runs`
- `feature_gates`
- `readiness_snapshots`
- `tool_capabilities`

The test verifies table presence, RLS enablement, expected policy names, `anon`/`authenticated` role targeting, and deny-only predicates/checks. It does not insert fixtures, does not depend on row data, and remains local-only/prohibited from staging, remote, and production targets.

## Prompt 26E-2 Validation Fix Attempt

Prompt 26E-2 attempted to validate `002_rls_no_policy_advisor_tables_local.sql`, but local preflight blocked execution before `supabase start` or SQL:

- `supabase_cli_arch_mismatch`
- `docker_daemon_unavailable`
- `local_db_url_missing`

No SQL ran. The file remains a local executable candidate only, not local pass evidence.
