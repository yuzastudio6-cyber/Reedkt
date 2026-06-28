# Qwen2.5-VL 7B Backend Runtime Persistence Baseline QA Reports Approved Snapshot Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_qa_reports_approved_snapshot_fix_recorded`.

This packet records a narrow active-baseline compatibility fix for Qwen backend runtime persistence local harness validation. Retry 10 proved the QA check-results reserved-column fix worked, then stopped before Qwen draft SQL while active migration `202605180006_reeditpro_qa_exports_audit.sql` created `idx_qa_reports_project_snapshot`. The index referenced `qa_reports.approved_plan_snapshot_id` before that compatibility column existed on the older active local baseline table, producing `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`.

The fix updates only `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`. It adds a nullable, idempotent `qa_reports.approved_plan_snapshot_id` compatibility column before `idx_qa_reports_project_snapshot` runs, documents the column, and guards the foreign key constraint. It does not backfill the column, create QA reports, create approved snapshots, create worker rows, create generated assets, seed QA data, create credit records, or add Qwen runtime data.

This is a baseline source repair only. It does not run SQL, start Supabase, start Docker, create a new migration, deploy a migration, apply Qwen draft SQL, run Qwen local SQL tests, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Repaired Migration

- Repaired file: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- Failed statement category: `qa_reports_approved_plan_snapshot_id_missing`
- Previous failure: `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`
- Missing column: `public.qa_reports.approved_plan_snapshot_id`
- Failed index: `idx_qa_reports_project_snapshot`
- Repair: `add_idempotent_qa_reports_approved_plan_snapshot_compatibility_column`
- Compatibility column: `qa_reports.approved_plan_snapshot_id uuid`
- Constraint guarded: `qa_reports_approved_plan_snapshot_id_fkey`
- Backfill policy: `no_backfill_because_migration_must_not_invent_qa_reports_approved_snapshots_generated_assets_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`

## Runtime Gates

- `baselineQaReportsApprovedSnapshotFixRecorded=true`
- `activeBaselineQaExportsAuditMigrationEdited=true`
- `qaReportsApprovedPlanSnapshotColumnGuarded=true`
- `qaReportsApprovedPlanSnapshotForeignKeyGuarded=true`
- `qaReportsProjectSnapshotIndexUnblocked=true`
- `qaReportsApprovedSnapshotBackfillSkipped=true`
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

- The active QA exports/audit migration now guards `qa_reports.approved_plan_snapshot_id` before `idx_qa_reports_project_snapshot` can run.
- The fix avoids duplicating QA tables or inventing QA reports, approved snapshots, worker rows, generated assets, credit records, or Qwen runtime rows.
- The next correct action is another approved local harness retry to determine whether the active baseline reaches Qwen draft SQL.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed after this fix.
- Qwen draft SQL has not applied.
- Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AP-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11: retry Qwen local harness validation after qa_reports approved-snapshot baseline fix, no deploy/no cloud/no assets/no beta`
