# Qwen2.5-VL 7B Backend Runtime Persistence Baseline QA Check Results Check Column Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_qa_check_results_check_column_fix_recorded`.

This packet records a narrow active-baseline syntax fix for Qwen backend runtime persistence local harness validation. Retry 9 proved the generated asset versions version baseline fix worked, then stopped before Qwen draft SQL while active migration `202605180006_reeditpro_qa_exports_audit.sql` created `public.qa_check_results`. The migration declared `check text`; PostgreSQL parsed `check` as a keyword and failed with `syntax error at or near "text" (SQLSTATE 42601)`.

The fix updates only `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`. It preserves the intended legacy column name as a quoted identifier, `"check" text`, so the active baseline can parse. It does not rename the table, create a replacement table, create rows, seed QA data, backfill QA results, create generated assets, or add Qwen runtime data.

This is a baseline source repair only. It does not run SQL, start Supabase, start Docker, create a new migration, deploy a migration, apply Qwen draft SQL, run Qwen local SQL tests, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Repaired Migration

- Repaired file: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- Failed statement category: `qa_check_results_check_reserved_column`
- Previous failure: `syntax error at or near "text" (SQLSTATE 42601)`
- Reserved column: `public.qa_check_results.check`
- Repair: `quote_reserved_check_identifier`
- Preserved column SQL: `"check" text`
- Backfill policy: `no_backfill_because_migration_must_not_invent_qa_results_generated_assets_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records`

## Runtime Gates

- `baselineQaCheckResultsCheckColumnFixRecorded=true`
- `activeBaselineQaExportsAuditMigrationEdited=true`
- `qaCheckResultsCheckColumnQuoted=true`
- `qaCheckResultsCheckColumnRenameSkipped=true`
- `qaCheckResultsRowsCreated=false`
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

- The active QA exports/audit migration now preserves the legacy `qa_check_results.check` column name as a quoted identifier so PostgreSQL can parse the table definition.
- The fix avoids duplicating QA tables or inventing QA rows.
- The next correct action is another approved local harness retry to determine whether the active baseline reaches Qwen draft SQL.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed after this fix.
- Qwen draft SQL has not applied.
- Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AN-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-10: retry Qwen local harness validation after qa_check_results check column fix, no deploy/no cloud/no assets/no beta`
