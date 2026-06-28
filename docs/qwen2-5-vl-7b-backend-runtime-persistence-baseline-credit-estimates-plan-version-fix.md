# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Credit Estimates Plan Version Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_credit_estimates_plan_version_fix_recorded`.

This packet records a narrow active-baseline compatibility fix for Qwen backend runtime persistence local harness validation. Retry 6 proved the credit approval snapshots baseline fix worked, then stopped before Qwen draft SQL while active migration `202605180004_reeditpro_credits_approval_snapshots.sql` created `idx_credit_estimates_project_plan`. The older active local baseline can already contain `public.credit_estimates` without `edit_plan_version_id`, so the index failed with `column "edit_plan_version_id" does not exist (SQLSTATE 42703)`.

The fix updates only `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`. It adds a nullable idempotent `public.credit_estimates.edit_plan_version_id` compatibility column before comments, constraints, and `idx_credit_estimates_project_plan` run. It also guards `credit_estimates_edit_plan_version_id_fkey` so older local baselines keep the same edit-plan-version reference shape as fresh installs. The fix intentionally does not backfill from older estimate data because it must not invent `edit_plan_versions`, credit estimates, approval records, approved snapshots, reservations, ledger entries, or credit movements.

This is a baseline source repair only. It does not run SQL, start Supabase, start Docker, create a new migration, deploy a migration, apply Qwen draft SQL, run Qwen local SQL tests, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Repaired Migration

- Repaired file: `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- Failed statement category: `idx_credit_estimates_project_plan`
- Previous failure: `column "edit_plan_version_id" does not exist (SQLSTATE 42703)`
- Compatibility column: `public.credit_estimates.edit_plan_version_id`
- Constraint guard: `credit_estimates_edit_plan_version_id_fkey`
- Index unblocked: `idx_credit_estimates_project_plan`
- Backfill policy: `no_backfill_because_migration_must_not_invent_edit_plan_versions_or_credit_records`

## Runtime Gates

- `baselineCreditEstimatesPlanVersionFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `creditEstimatesEditPlanVersionColumnGuarded=true`
- `creditEstimatesEditPlanVersionForeignKeyGuarded=true`
- `creditEstimatesProjectPlanIndexUnblocked=true`
- `creditEstimatesPlanVersionBackfillSkipped=true`
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

- The active baseline migration now guards `credit_estimates.edit_plan_version_id` before `idx_credit_estimates_project_plan` runs.
- Older local baselines can receive the nullable plan-version reference column without inventing historical edit plan versions.
- The next correct action is another approved local harness retry to determine whether the active baseline reaches Qwen draft SQL.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed after this fix.
- Qwen draft SQL has not applied.
- Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AH-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-7: retry Qwen local harness validation after credit estimates plan-version baseline fix, no deploy/no cloud/no assets/no beta`
