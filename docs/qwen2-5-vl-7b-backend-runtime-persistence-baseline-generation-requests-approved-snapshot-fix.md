# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Generation Requests Approved Snapshot Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_generation_requests_approved_snapshot_fix_recorded`.

This packet records a narrow active-baseline compatibility fix for Qwen backend runtime persistence local harness validation. Retry 7 proved the credit estimates plan-version baseline fix worked, then stopped before Qwen draft SQL while active migration `202605180005_reeditpro_generation_assets_jobs.sql` created `idx_generation_requests_project_snapshot`. The older active local baseline can already contain `public.generation_requests` without `approved_plan_snapshot_id`, so the index failed with `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`.

The fix updates only `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`. It adds a nullable idempotent `public.generation_requests.approved_plan_snapshot_id` compatibility column before comments, constraints, and `idx_generation_requests_project_snapshot` run. It also guards `generation_requests_approved_plan_snapshot_id_fkey` so older local baselines keep the same approved-snapshot reference shape as fresh installs. The fix intentionally does not backfill because it must not invent approved snapshots, generation requests, generated assets, jobs, worker rows, storage records, credit rows, provider outputs, or Qwen runtime records.

This is a baseline source repair only. It does not run SQL, start Supabase, start Docker, create a new migration, deploy a migration, apply Qwen draft SQL, run Qwen local SQL tests, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Repaired Migration

- Repaired file: `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- Failed statement category: `idx_generation_requests_project_snapshot`
- Previous failure: `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`
- Compatibility column: `public.generation_requests.approved_plan_snapshot_id`
- Constraint guard: `generation_requests_approved_plan_snapshot_id_fkey`
- Index unblocked: `idx_generation_requests_project_snapshot`
- Backfill policy: `no_backfill_because_migration_must_not_invent_approved_snapshots_generation_requests_assets_jobs_workers_storage_or_credit_records`

## Runtime Gates

- `baselineGenerationRequestsApprovedSnapshotFixRecorded=true`
- `activeBaselineGenerationAssetsJobsMigrationEdited=true`
- `generationRequestsApprovedPlanSnapshotColumnGuarded=true`
- `generationRequestsApprovedPlanSnapshotForeignKeyGuarded=true`
- `generationRequestsProjectSnapshotIndexUnblocked=true`
- `generationRequestsApprovedSnapshotBackfillSkipped=true`
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

- The active baseline migration now guards `generation_requests.approved_plan_snapshot_id` before `idx_generation_requests_project_snapshot` runs.
- Older local baselines can receive the nullable approved-snapshot reference column without inventing historical approved snapshots, generation requests, assets, jobs, storage records, worker rows, credit rows, or provider output.
- The next correct action is another approved local harness retry to determine whether the active baseline reaches Qwen draft SQL.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed after this fix.
- Qwen draft SQL has not applied.
- Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AJ-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-8: retry Qwen local harness validation after generation requests approved-snapshot baseline fix, no deploy/no cloud/no assets/no beta`
