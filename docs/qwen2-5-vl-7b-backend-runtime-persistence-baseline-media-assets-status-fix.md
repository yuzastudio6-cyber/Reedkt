# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Media Assets Status Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_media_assets_status_fix_recorded`.

This packet records the narrow ReEditPro active-baseline migration fix required after Qwen local harness validation retry 3. The retry proved `202605180001_reeditpro_core_workspace_projects.sql` now applies past the prior `projects.current_edit_session_id` prerequisite failure, then stopped before Qwen draft SQL because active migration `202605180002_reeditpro_media_source_sequence.sql` referenced `media_assets.status` before that compatibility column existed on the older active baseline table.

The fix makes `202605180002_reeditpro_media_source_sequence.sql` compatible with the older `public.media_assets` table created by `202605130001_core_reeditpro_tables.sql`. It adds an idempotent `public.media_assets.status` compatibility column before the migration creates `idx_media_assets_project_status`, and it backfills `status` from `processing_status` only when the older column exists. It does not recreate baseline tables, create a new migration, deploy a migration, touch Supabase cloud, start Supabase, start Docker, execute SQL, apply the Qwen draft SQL, run Qwen local SQL tests, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-3`
- Failed baseline migration: `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`
- Failed statement category: `idx_media_assets_project_status`
- Sanitized failure: `column "status" does not exist (SQLSTATE 42703)`
- Current edit session baseline fix verified: true
- Qwen draft SQL reached before fix: false
- Qwen local SQL tests reached before fix: false

## SQL Repair

The migration now prepares the existing active-baseline `media_assets` table before the later project/status index runs:

- `public.media_assets.status`

When the older compatibility source exists, the migration backfills:

- `public.media_assets.processing_status_to_status`

This preserves the existing ReEditPro baseline, keeps upload-service `processing_status` behavior intact, and gives the later RP-DATA-04 media source sequence index a stable text `status` column.

## Runtime Gates

- `baselineMediaAssetsStatusFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `mediaAssetsStatusColumnGuarded=true`
- `mediaAssetsProcessingStatusBackfillGuarded=true`
- `mediaAssetsProjectStatusIndexUnblocked=true`
- `newActiveMigrationCreated=false`
- `qwenActiveMigrationCreated=false`
- `supabaseCliExecuted=false`
- `dockerStarted=false`
- `sqlExecuted=false`
- `migrationDeployed=false`
- `qwenDraftSqlApplied=false`
- `qwenLocalSqlTestsExecuted=false`
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

- The known active baseline `media_assets.status` prerequisite failure has a narrow source fix.
- The fix does not duplicate the ReEditPro `media_assets` table.
- The fix does not alter Qwen model routing, worker dispatch, provider calls, or generated asset behavior.
- The next safe step is another local harness validation retry, not beta or production.

## What This Does Not Prove

- The full active ReEditPro baseline has not been reloaded after this fix in this packet.
- The Qwen draft SQL has not applied after this fix in this packet.
- The Qwen local SQL tests have not run after this fix in this packet.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AB-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-4: retry Qwen local harness validation after media_assets status baseline fix, no deploy/no cloud/no assets/no beta`
