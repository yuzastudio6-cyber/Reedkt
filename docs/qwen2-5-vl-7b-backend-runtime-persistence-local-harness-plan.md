# Qwen2.5-VL 7B Backend Runtime Persistence Local Harness Plan

Decision: `qwen2_5_vl_backend_runtime_persistence_local_harness_plan_recorded_config_required`.

This packet defines the approved local database harness shape needed before Qwen2.5-VL backend runtime persistence SQL can be validated. It consumes the blocked local-validation result and keeps the next step bounded to safe local Supabase-compatible configuration.

This is harness-plan evidence only. It does not create `supabase/config.toml`, execute SQL, run Supabase CLI, start Docker, create a database, drop a database, deploy migrations, mutate Supabase, create job rows, claim worker leases, create idempotency rows, create storage object records, create signed URL events, create QA reports, create audit events, call Cloud Run, fetch identity tokens, run inference, load Qwen, initialize vLLM, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Harness Purpose

The Qwen persistence draft must be validated only after an approved local Supabase-compatible ReEditPro baseline exists. The draft intentionally reuses existing runtime surfaces, so plain PostgreSQL without Supabase platform schemas and ReEditPro migrations is not enough.

The harness must prove:

- Supabase platform schemas are present for auth and storage dependencies.
- ReEditPro app baseline migrations are loaded in timestamp order.
- Qwen draft SQL is applied after the baseline only.
- Qwen local SQL tests run only after the draft applies.
- Validation output is sanitized and contains no secrets, database URLs, signed URLs, Cloud Run URLs, raw prompt payloads, raw model output, or public artifact references.
- Cleanup is verified before any pass can be considered.

## Current Preflight State

- `supabase/config.toml` exists now: false
- Approved local harness exists now: false
- SQL executed now: false
- Supabase CLI executed now: false
- Docker started now: false
- Local database created now: false
- Local database dropped now: false
- Cloud Supabase touched now: false

## Harness Options

| Option | Status | Use |
| --- | --- | --- |
| Repo-local Supabase harness config | planned | Preferred path after a reviewed safe `supabase/config.toml` is added. |
| Existing approved local harness | conditional | Allowed only if a committed owner-approved harness appears in the repo before retry. |
| Plain local PostgreSQL | rejected | It does not prove Supabase platform schemas such as auth and storage dependencies. |
| Cloud, staging, production, or live data | rejected | Qwen draft validation must not touch cloud or live environments. |
| Manual platform stubs | rejected | Stubs can create false confidence and do not represent real Supabase platform behavior. |

## Required Baseline Relations

The approved local harness must load or provide these baseline surfaces before applying the Qwen draft:

- `approved_plan_snapshots`
- `credit_reservations`
- `jobs`
- `job_events`
- `worker_runtime_configs`
- `worker_leases`
- `backend_runtime_messages`
- `job_claim_attempts`
- `api_idempotency_keys`
- `worker_job_claims`
- `storage_object_records`
- `signed_url_events`
- `tool_runtime_checks`

## Baseline Order Rule

The local harness must use `supabase/migration-order.md` plus active `supabase/migrations/*.sql` files as the baseline-order source. Draft SQL from `database/migration-drafts/` is not part of active baseline history and must be applied only after the active baseline is loaded in a local/non-production target.

## Qwen Draft Validation Inputs

- Draft SQL: `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`
- Draft tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Validation result source: `docs/qwen2-5-vl-7b-backend-runtime-persistence-local-validation-result.md`

The draft and tests remain unchanged by this plan.

## Config Requirements

A future safe local `supabase/config.toml` must:

- be repo-local and reviewable;
- identify a local-only ReEditPro Qwen validation harness;
- use loopback/local service values only;
- disable or omit analytics and edge runtime paths not required for database validation;
- avoid remote project refs, cloud refs, production IDs, staging IDs, secrets, key values, database passwords, environment variable expansion, signed URL settings, public artifact settings, provider settings, worker dispatch settings, and model runtime settings;
- remain compatible with the current Supabase CLI after command discovery via help output.

## Future Validation Flow

Future validation may proceed only after config creation and verification:

1. Verify repo state is clean and the branch contains the approved config.
2. Verify the local Supabase CLI and Docker-compatible runtime are available without starting services.
3. Start only the approved local harness in a later execution prompt.
4. Load the active ReEditPro baseline in the approved local target.
5. Apply only the Qwen draft SQL.
6. Run only the Qwen local SQL tests.
7. Record sanitized pass/fail output.
8. Stop and clean up the local harness.

These are future steps only. This packet does not run them.

## Runtime Gates

- `backendRuntimePersistenceLocalValidationResultRecorded=true`
- `backendRuntimePersistenceLocalHarnessPlanRecorded=true`
- `backendRuntimePersistenceLocalHarnessConfigRequired=true`
- `configTomlCreated=false`
- `approvedLocalHarnessExists=false`
- `sqlExecuted=false`
- `supabaseTouched=false`
- `supabaseCliExecuted=false`
- `dockerStarted=false`
- `localDatabaseCreated=false`
- `localDatabaseDropped=false`
- `activeMigrationCreated=false`
- `draftSqlApplied=false`
- `localSqlTestsExecuted=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `workerClaimCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `storageObjectRecordCreated=false`
- `signedUrlEventCreated=false`
- `qaReportCreated=false`
- `auditEventCreated=false`
- `readyForRealWorkerDispatch=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- Qwen has a concrete local harness plan for validating its persistence draft.
- The plan rejects plain PostgreSQL, cloud/staging/production, live data, and manual platform stubs.
- The next concrete unlock is safe local config creation, not SQL execution.

## What This Does Not Prove

- `supabase/config.toml` has not been created.
- The local Supabase harness has not been started.
- The ReEditPro baseline has not been loaded.
- The Qwen draft migration has not been applied.
- The Qwen local SQL tests have not been executed.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58R-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-CONFIG-CREATE: create safe local Supabase config for Qwen persistence validation, no SQL/no deploy/no cloud/no assets/no beta`
