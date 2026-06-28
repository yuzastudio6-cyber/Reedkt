# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Generated Asset Versions Version Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_generated_asset_versions_version_fix_recorded`.

This packet records a narrow active-baseline compatibility fix for Qwen backend runtime persistence local harness validation. Retry 8 proved the generation requests approved-snapshot baseline fix worked, then stopped before Qwen draft SQL while active migration `202605180005_reeditpro_generation_assets_jobs.sql` created `idx_generated_asset_versions_asset_version`. The older active local baseline can already contain `public.generated_asset_versions` with `version_number` but without `version`, so the index failed with `column "version" does not exist (SQLSTATE 42703)`.

The fix updates only `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`. It adds a nullable idempotent `public.generated_asset_versions.version` compatibility column before `idx_generated_asset_versions_asset_version` runs. The fix intentionally does not backfill from `generated_asset_versions.version_number` because this migration must not invent generated asset versions, storage objects, jobs, worker rows, provider outputs, credit records, or Qwen runtime records.

This is a baseline source repair only. It does not run SQL, start Supabase, start Docker, create a new migration, deploy a migration, apply Qwen draft SQL, run Qwen local SQL tests, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Repaired Migration

- Repaired file: `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- Failed statement category: `idx_generated_asset_versions_asset_version`
- Previous failure: `column "version" does not exist (SQLSTATE 42703)`
- Compatibility column: `public.generated_asset_versions.version`
- Older baseline column observed: `public.generated_asset_versions.version_number`
- Index unblocked: `idx_generated_asset_versions_asset_version`
- Backfill policy: `no_backfill_because_migration_must_not_invent_generated_asset_versions_storage_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`

## Runtime Gates

- `baselineGeneratedAssetVersionsVersionFixRecorded=true`
- `activeBaselineGenerationAssetsJobsMigrationEdited=true`
- `generatedAssetVersionsVersionColumnGuarded=true`
- `generatedAssetVersionsVersionBackfillSkipped=true`
- `generatedAssetVersionsAssetVersionIndexUnblocked=true`
- `newActiveMigrationCreated=false`
- `qwenActiveMigrationCreated=false`
- `supabaseCliExecuted=false`
- `dockerStarted=false`
- `sqlExecuted=false`
- `migrationDeployed=false`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
- `localHarnessStarted=false`
- `localHarnessValidationAttemptedAfterFix=false`
- `localHarnessValidationPassedAfterFix=false`
- `privateInvokeReady=false`
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

- The active baseline migration now guards `generated_asset_versions.version` before `idx_generated_asset_versions_asset_version` runs.
- Older local baselines can receive the nullable version compatibility column without inventing generated asset versions, storage records, jobs, worker rows, provider output, credit records, or Qwen runtime records.
- The next correct action is another approved local harness retry to determine whether the active baseline reaches Qwen draft SQL.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed after this fix.
- Qwen draft SQL has not applied.
- Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AL-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-9: retry Qwen local harness validation after generated_asset_versions version baseline fix, no deploy/no cloud/no assets/no beta`
