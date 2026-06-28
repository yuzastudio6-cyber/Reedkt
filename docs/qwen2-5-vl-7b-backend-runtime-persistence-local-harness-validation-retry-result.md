# Qwen2.5-VL 7B Backend Runtime Persistence Local Harness Validation Retry Result

Decision: `qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_blocked_baseline_migration_ambiguity`.

This packet records the Qwen2.5-VL backend runtime persistence local harness validation retry after the port-fix gate. The retry used the repo-local Qwen Supabase harness config with non-conflicting local ports `55430`, `55431`, `55432`, `55433`, and `55434`.

The retry did not reach Qwen draft SQL. The local Supabase baseline load failed while applying active ReEditPro migration `202605130007_generation_providers_generated_assets.sql` with `column reference "description" is ambiguous (SQLSTATE 42702)`. The failure occurred before `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql` or `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql` could run.

This is validation-result evidence only. It does not deploy migrations, touch Supabase cloud, touch staging, touch production, use live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-port-fix`
- Config path: `supabase/config.toml`
- Config project id: `reeditpro_qwen_local_harness`
- Qwen local DB port: `55432`
- Qwen local API port: `55431`
- Qwen local Studio port: `55433`
- Qwen local Inbucket port: `55434`
- Qwen local shadow DB port: `55430`
- Draft SQL input: `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql`
- Draft test input: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`

## Preflight

- Pre-SQL no-execution smokes passed: true
- Local Supabase CLI architecture verified: true
- Local Docker CLI availability verified: true
- Local psql availability verified: true
- Fixed Qwen ports free before retry: true
- Cloud project link present: false
- Existing local `reeditpro` Supabase project stopped or mutated: false

## Retry Attempt

- Local Supabase harness start attempted: true
- Local Supabase CLI command used: `supabase start --yes`
- Local baseline migrations attempted: true
- Last successful baseline migration observed: `202605130006_stroke_motion_data_model.sql`
- Failed baseline migration: `202605130007_generation_providers_generated_assets.sql`
- Failed statement category: `generation_provider_models` seed insert
- Sanitized failure: `column reference "description" is ambiguous (SQLSTATE 42702)`
- Qwen draft SQL applied: false
- Qwen local SQL tests executed: false
- Qwen generated/local fixture passed: false

## Cleanup

- Cleanup command used: `supabase stop --project-id reeditpro_qwen_local_harness --no-backup`
- Cleanup command exit code: `0`
- Qwen local containers left behind: false
- Qwen fixed ports free after cleanup: true
- Existing local `reeditpro` Supabase project stopped: false

## Runtime Gates

- `backendRuntimePersistenceLocalHarnessValidationRetryResultRecorded=true`
- `backendRuntimePersistenceLocalHarnessValidationRetryAttempted=true`
- `backendRuntimePersistenceLocalHarnessValidationRetryPassed=false`
- `backendRuntimePersistenceLocalHarnessStarted=false`
- `backendRuntimePersistenceLocalHarnessStartAttempted=true`
- `backendRuntimePersistenceLocalHarnessPortConflictDetected=false`
- `backendRuntimePersistenceLocalHarnessBaselineMigrationAttempted=true`
- `backendRuntimePersistenceLocalHarnessBaselineMigrationPassed=false`
- `backendRuntimePersistenceLocalHarnessBaselineMigrationFixRequired=true`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
- `qwenLocalContainersLeftBehind=false`
- `unrelatedLocalSupabaseProjectStopped=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `cloudRunInvocationAttempted=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The Qwen local harness no longer fails on the old `54322` port conflict.
- The fixed Qwen ports were usable at preflight time.
- The local Supabase-compatible baseline path can begin applying active ReEditPro migrations.
- The next blocker is an existing active baseline migration ambiguity, not Qwen draft SQL.
- Cleanup left no Qwen containers or occupied Qwen fixed ports.

## What This Does Not Prove

- The ReEditPro active baseline did not fully load.
- `approved_plan_snapshots`, runtime tables, storage surfaces, and Qwen required baseline relations were not verified after a full baseline load.
- The Qwen draft SQL did not apply.
- The Qwen local SQL tests did not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58W-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-BASELINE-MIGRATION-FIX: fix ReEditPro local baseline migration ambiguity for Qwen harness validation, no deploy/no cloud/no assets/no beta`
