# Qwen2.5-VL 7B Backend Runtime Persistence Local Harness Validation Retry 8 Result

Decision: `qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_8_blocked_generated_asset_versions_version_baseline_column`.

This packet records Qwen backend runtime persistence local harness validation retry 8 after the generation requests approved-snapshot baseline fix. The retry proved the previous blocker was fixed: active migration `202605180005_reeditpro_generation_assets_jobs.sql` advanced past `idx_generation_requests_project_snapshot` after the nullable `generation_requests.approved_plan_snapshot_id` compatibility guard was added. The retry still did not reach Qwen draft SQL. The local Supabase baseline load later failed in the same active ReEditPro migration because `idx_generated_asset_versions_asset_version` references `generated_asset_versions.version`, while the older active generated-assets baseline table exposes `version_number` and does not yet expose the compatibility column `version` (`SQLSTATE 42703`). The failure occurred before `database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql` or `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql` could run.

This is a local harness validation result only. It does not create a new migration, deploy a migration, touch Supabase cloud, staging, production, or live data, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-baseline-generation-requests-approved-snapshot-fix`
- Local harness project id: `reeditpro_qwen_local_harness`
- Fixed local ports: `55430`, `55431`, `55432`, `55433`, `55434`
- Previous baseline fix verified: `generation_requests.approved_plan_snapshot_id`
- Previously blocked index verified: `idx_generation_requests_project_snapshot`
- Failed baseline migration: `202605180005_reeditpro_generation_assets_jobs.sql`
- Failed statement category: `idx_generated_asset_versions_asset_version`
- Sanitized failure: `column "version" does not exist (SQLSTATE 42703)`
- Missing baseline column: `generated_asset_versions.version`
- Older baseline column observed: `generated_asset_versions.version_number`
- Qwen draft SQL reached: false
- Qwen local SQL tests reached: false

## Cleanup

- Cleanup command: `supabase stop --project-id reeditpro_qwen_local_harness --no-backup`
- Cleanup exit code: `0`
- Qwen local containers left behind: false
- Fixed Qwen local ports free after cleanup: true
- Existing unrelated local Supabase project stopped: false
- Generated Supabase temp metadata removed: true

## Runtime Gates

- `backendRuntimePersistenceLocalHarnessValidationRetry8ResultRecorded=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry8Attempted=true`
- `backendRuntimePersistenceLocalHarnessValidationRetry8Passed=false`
- `backendRuntimePersistenceGenerationRequestsApprovedSnapshotBaselineFixVerified=true`
- `backendRuntimePersistenceGeneratedAssetVersionsVersionBaselineFixRequired=true`
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

- The generation requests approved-snapshot baseline fix lets the active baseline advance past `idx_generation_requests_project_snapshot`.
- The next active baseline prerequisite is now isolated to `generated_asset_versions.version` handling before `idx_generated_asset_versions_asset_version` in `202605180005_reeditpro_generation_assets_jobs.sql`.
- The Qwen draft SQL still has not run, so this remains persistence validation progress rather than runtime readiness.

## What This Does Not Prove

- The full active ReEditPro baseline has not completed.
- The Qwen draft SQL has not applied.
- The Qwen local SQL tests have not run.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AK-BACKEND-RUNTIME-PERSISTENCE-BASELINE-GENERATED-ASSET-VERSIONS-VERSION-FIX: fix ReEditPro local baseline generated_asset_versions version for Qwen harness validation, no deploy/no cloud/no assets/no beta`
