# Qwen2.5-VL 7B Backend Runtime Persistence Active Migration Adopted Local Validation

Decision: `qwen2_5_vl_backend_runtime_persistence_active_migration_adopted_local_validation_passed_remote_satisfaction_review_required`.

This packet records local validation of the adopted Qwen2.5-VL backend runtime persistence active migration history version. The repo-local Supabase-compatible harness applied the active ReEditPro baseline, observed the adopted migration history version `20260628000100`, and the Qwen backend runtime persistence SQL tests passed.

This is local harness validation evidence only. It does not deploy a migration, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Inputs

- History adoption packet: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-adoption.md`
- History reconciliation packet: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-history-reconciliation.md`
- Adopted active migration: `supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`
- Superseded local duplicate: `supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql`
- Local SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Local harness config: `supabase/config.toml`

## Preflight

- Pre-validation no-execution smokes passed: true
- Supabase changelog and current CLI/local-development docs checked: true
- Supabase CLI version observed: `2.105.0`
- Docker CLI available: true
- Local harness config exists: true
- Local harness project id: `reeditpro_qwen_local_harness`
- Local harness ports: `55430`, `55431`, `55432`, `55433`, `55434`
- Qwen local ports free before start: true
- Supabase cloud project link used: false
- Supabase cloud touched: false

## Local Harness Execution

- Local harness startup attempted: true
- Local harness startup passed: true
- Active ReEditPro baseline migrations attempted: true
- Active ReEditPro baseline migrations passed: true
- Adopted active Qwen migration reached: true
- Adopted active Qwen migration applied: true
- Adopted active migration history version observed: `20260628000100`
- Superseded local duplicate migration history version observed: false
- Required baseline relations observed: `approved_plan_snapshots`, `jobs`, `worker_runtime_configs`
- Qwen local SQL tests attempted: true
- Qwen local SQL tests executed: true
- Qwen local SQL tests passed: true
- CLI and SQL output was sanitized before this packet; local default development keys, connection strings, database passwords, storage keys, and JWT secrets are not recorded in repo evidence.

## Validated Adopted Migration Scope

The local SQL tests verified:

- required runtime tables were present;
- `media_analysis` job type exists;
- `qwen25_vl_jobs_payload_refs_check` exists and includes approved snapshot, private storage, checksum, structured findings, edit intents, model id, pinned revision, `nvidia_l4`, and `bounded_preview_scale_to_zero`;
- `qwen25_vl_job_events_sanitized_payload_check` exists;
- `qwen25_vl_worker_runtime_config_check` exists;
- worker lease, backend runtime message, and job claim attempt Qwen guards exist;
- `tool_runtime_checks` accepts `qwen_vl`;
- Qwen-specific indexes exist;
- storage object records do not gain signed URL source-of-truth columns;
- signed URL events do not gain URL-value source-of-truth columns;
- runtime surfaces do not gain raw prompt columns.

## Cleanup

- Cleanup command: `supabase stop --project-id reeditpro_qwen_local_harness --no-backup`
- Cleanup observed: local Supabase setup stopped
- Qwen local containers left behind: false
- Fixed Qwen local ports free after cleanup: true
- Generated Supabase temp metadata removed: true
- Generated Supabase branch metadata removed: true

## Runtime Gates

- `backendRuntimePersistenceActiveMigrationAdoptedLocalValidationResultRecorded=true`
- `backendRuntimePersistenceActiveMigrationAdoptedLocalValidationAttempted=true`
- `backendRuntimePersistenceActiveMigrationAdoptedLocalValidationPassed=true`
- `backendRuntimePersistenceActiveMigrationAdoptedHistoryObserved=true`
- `backendRuntimePersistenceActiveMigrationAdoptedHistoryVersion=20260628000100`
- `backendRuntimePersistenceActiveMigrationSupersededHistoryObserved=false`
- `qwenLocalSqlTestsExecuted=true`
- `qwenLocalSqlTestsPassed=true`
- `backendRuntimePersistenceActiveMigrationRemoteSatisfactionReviewRequired=true`
- `backendRuntimePersistenceActiveMigrationDeployed=false`
- `migrationDeployed=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The adopted active Qwen backend runtime persistence migration version `20260628000100` applies in the approved local Supabase-compatible harness.
- The local migration history records adopted version `20260628000100`.
- The superseded duplicate local version `20260629011700` is not present in local migration history.
- The Qwen backend runtime persistence SQL tests pass against the adopted active migration.
- The adopted migration preserves the validated L4 scale-to-zero metadata, approved snapshot/private storage/checksum source-of-truth requirements, and raw prompt/signed URL/public URL/secret rejection guards.

## What This Does Not Prove

- It does not deploy anything to Supabase cloud, staging, production, or live data.
- It does not by itself decide whether a future deploy command is still needed, because the remote already reports version `20260628000100` and requires a no-deploy satisfaction review.
- It does not enable real worker dispatch.
- It does not send a Cloud Run private invoke request.
- It does not run Qwen inference.
- It does not create a generated asset, public artifact, signed URL, QA row, audit row, or credit mutation.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.
- Beta and production remain blocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BI-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-REMOTE-SATISFACTION-REVIEW: accept adopted remote Qwen migration as satisfied/no deploy, no assets/no beta`
