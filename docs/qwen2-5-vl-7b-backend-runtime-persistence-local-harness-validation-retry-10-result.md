# Qwen2.5-VL 7B Backend Runtime Persistence Local Harness Validation Retry 10 Result

Decision: `qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_10_blocked_qa_reports_approved_plan_snapshot_id_missing`.

This packet records Qwen backend runtime persistence local harness validation retry 10 after the QA check-results reserved-column baseline fix. The retry proved the previous blocker was fixed: active migration `202605180006_reeditpro_qa_exports_audit.sql` now parses the preserved legacy `qa_check_results.check` column as `"check" text`. The retry still did not reach Qwen draft SQL. The local Supabase baseline load later failed in the same active ReEditPro migration while creating `idx_qa_reports_project_snapshot` because `public.qa_reports` in the older active baseline did not expose `approved_plan_snapshot_id`, producing `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`. The failure occurred before `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql` or `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql` could run.

This is a local harness validation result only. It does not create a new migration, deploy a migration, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-check-results-check-column-fix`
- Local harness project id: `reeditpro_qwen_local_harness`
- Fixed local ports: `55430`, `55431`, `55432`, `55433`, `55434`
- Previous baseline fix verified: `qa_check_results.check`
- Previously failed baseline column verified: `"check" text`
- Failed baseline migration: `202605180006_reeditpro_qa_exports_audit.sql`
- Failed statement category: `qa_reports_approved_plan_snapshot_id_missing`
- Failed index: `idx_qa_reports_project_snapshot`
- Sanitized failure: `column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)`
- Missing column observed: `qa_reports.approved_plan_snapshot_id`
- Qwen draft SQL reached: false
- Qwen local SQL tests reached: false

## Preflight

- Pre-harness text smokes passed: true
- Local Supabase CLI compatible: true
- Docker CLI available: true
- Fixed Qwen local ports free before retry: true
- Supabase cloud project link used: false
- Supabase cloud touched: false

## Cleanup

- Cleanup command: `supabase stop --project-id reeditpro_qwen_local_harness --no-backup`
- Cleanup exit code: `0`
- Qwen local containers left behind: false
- Fixed Qwen local ports free after cleanup: true
- Existing unrelated local Supabase project stopped: false
- Generated Supabase temp metadata removed: true

## Runtime Gates

- `backendRuntimePersistenceLocalHarnessValidationRetry10ResultRecorded=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry10Attempted=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry10Passed=false`
- `backendRuntimePersistenceQaCheckResultsCheckReservedColumnFixVerified=true`
- `backendRuntimePersistenceQaReportsApprovedPlanSnapshotFixRequired=true`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
- `qwenLocalContainersLeftBehind=false`
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

- The QA check-results reserved-column baseline fix lets `202605180006_reeditpro_qa_exports_audit.sql` advance past the previous `qa_check_results.check` parser failure.
- The next active baseline prerequisite is now isolated to the `qa_reports.approved_plan_snapshot_id` column used by `idx_qa_reports_project_snapshot`.
- The Qwen draft SQL still has not run, so this remains persistence validation progress rather than runtime readiness.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed.
- The Qwen draft SQL has not applied.
- The Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AO-BACKEND-RUNTIME-PERSISTENCE-BASELINE-QA-REPORTS-APPROVED-SNAPSHOT-FIX: fix ReEditPro local baseline qa_reports approved_plan_snapshot_id for Qwen harness validation, no deploy/no cloud/no assets/no beta`
