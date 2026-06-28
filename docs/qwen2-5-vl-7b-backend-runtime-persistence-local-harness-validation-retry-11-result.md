# Qwen2.5-VL 7B Backend Runtime Persistence Local Harness Validation Retry 11 Result

Decision: `qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_11_blocked_rls_function_parameter_mismatch`.

This packet records Qwen backend runtime persistence local harness validation retry 11 after the QA reports approved-snapshot baseline fix. The retry proved the previous blocker was fixed: active migration `202605180006_reeditpro_qa_exports_audit.sql` now applies past `idx_qa_reports_project_snapshot` after the nullable `qa_reports.approved_plan_snapshot_id` compatibility guard and guarded `qa_reports_approved_plan_snapshot_id_fkey` were added. The retry still did not reach Qwen draft SQL. The local Supabase baseline load later failed in active migration `202605180007_reeditpro_rls_policies.sql` while replacing `public.is_workspace_member(uuid)` because older active baseline migrations created the function with input parameter `target_workspace_id`, while this migration attempts to replace it with input parameter `workspace_uuid`. PostgreSQL rejected the parameter rename with `cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`.

This is a local harness validation result only. It does not create a new migration, deploy a migration, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix`
- Local harness project id: `reeditpro_qwen_local_harness`
- Fixed local ports: `55430`, `55431`, `55432`, `55433`, `55434`
- Previous baseline fix verified: `qa_reports.approved_plan_snapshot_id`
- Previously failed index verified: `idx_qa_reports_project_snapshot`
- Previously failed constraint verified: `qa_reports_approved_plan_snapshot_id_fkey`
- Failed baseline migration: `202605180007_reeditpro_rls_policies.sql`
- Failed statement category: `rls_is_workspace_member_parameter_name_mismatch`
- Sanitized failure: `cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)`
- Existing baseline parameter observed: `target_workspace_id`
- Replacement parameter attempted: `workspace_uuid`
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
- Cleanup observed: local Supabase setup stopped
- Qwen local containers left behind: false
- Fixed Qwen local ports free after cleanup: true
- Existing unrelated local Supabase project stopped: false
- Generated Supabase temp metadata removed: true

## Runtime Gates

- `backendRuntimePersistenceLocalHarnessValidationRetry11ResultRecorded=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry11Attempted=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry11Passed=false`
- `backendRuntimePersistenceQaReportsApprovedSnapshotFixVerified=true`
- `backendRuntimePersistenceRlsFunctionParameterFixRequired=true`
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

- The QA reports approved-snapshot baseline fix lets `202605180006_reeditpro_qa_exports_audit.sql` advance past the previous `idx_qa_reports_project_snapshot` failure.
- The next active baseline prerequisite is isolated to the RLS helper function parameter mismatch in `202605180007_reeditpro_rls_policies.sql`.
- The Qwen draft SQL still has not run, so this remains persistence validation progress rather than runtime readiness.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed.
- The Qwen draft SQL has not applied.
- The Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AQ-BACKEND-RUNTIME-PERSISTENCE-BASELINE-RLS-FUNCTION-PARAMETER-FIX: fix ReEditPro local baseline is_workspace_member parameter compatibility for Qwen harness validation, no deploy/no cloud/no assets/no beta`
