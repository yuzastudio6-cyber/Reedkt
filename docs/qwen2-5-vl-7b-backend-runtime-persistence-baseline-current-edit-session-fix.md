# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Current Edit Session Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_current_edit_session_fix_recorded`.

This packet records the narrow ReEditPro active-baseline migration fix required after Qwen local harness validation retry 2. The retry proved the previous `202605130007_generation_providers_generated_assets.sql` ambiguity fix worked, then stopped before Qwen draft SQL because active migration `202605180001_reeditpro_core_workspace_projects.sql` referenced `projects.current_edit_session_id` before that column existed in the local baseline.

The fix makes `202605180001_reeditpro_core_workspace_projects.sql` compatible with the older active baseline tables created by `202605130001_core_reeditpro_tables.sql`. It adds idempotent compatibility columns for the existing `workspaces`, `projects`, and `chat_messages` tables before the migration creates indexes and foreign keys that reference those columns. It does not recreate baseline tables, create a new migration, deploy a migration, touch Supabase cloud, start Supabase, start Docker, execute SQL, apply the Qwen draft SQL, run Qwen local SQL tests, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-2`
- Failed baseline migration: `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`
- Failed statement category: `projects_current_edit_session_id_fkey`
- Sanitized failure: `column "current_edit_session_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)`
- Previous baseline fix verified: true
- Qwen draft SQL reached before fix: false
- Qwen local SQL tests reached before fix: false

## SQL Repair

The migration now prepares existing active-baseline tables before later constraints and indexes run:

- `public.workspaces.owner_id`
- `public.workspaces.metadata_json`
- `public.projects.owner_id`
- `public.projects.editing_category`
- `public.projects.current_edit_session_id`
- `public.projects.metadata_json`
- `public.chat_messages.edit_session_id`
- `public.chat_messages.attachments_json`
- `public.chat_messages.related_clip_ids_json`
- `public.chat_messages.metadata_json`

When older compatibility columns exist, the migration backfills:

- `workspaces.owner_id` from `workspaces.owner_user_id`
- `workspaces.metadata_json` from `workspaces.metadata`
- `projects.owner_id` from `projects.created_by`
- `projects.metadata_json` from `projects.metadata`

This preserves the existing ReEditPro baseline and keeps the migration idempotent when it is loaded after earlier active migrations.

## Runtime Gates

- `baselineCurrentEditSessionFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `projectsCurrentEditSessionColumnGuarded=true`
- `workspaceCompatibilityColumnsGuarded=true`
- `projectCompatibilityColumnsGuarded=true`
- `chatMessageCompatibilityColumnsGuarded=true`
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

- The known active baseline `current_edit_session_id` prerequisite failure has a narrow source fix.
- The fix does not duplicate ReEditPro baseline tables.
- The fix does not create Qwen runtime tables or change Qwen model routing.
- The next safe step is another local harness validation retry, not beta or production.

## What This Does Not Prove

- The full active ReEditPro baseline has not been reloaded after this fix in this packet.
- The Qwen draft SQL has not applied after this fix in this packet.
- The Qwen local SQL tests have not run after this fix in this packet.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58Z-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-3: retry Qwen local harness validation after current_edit_session baseline fix, no deploy/no cloud/no assets/no beta`
