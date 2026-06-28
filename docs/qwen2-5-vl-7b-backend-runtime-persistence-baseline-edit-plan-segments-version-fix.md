# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Edit Plan Segments Version Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_edit_plan_segments_version_fix_recorded`.

This packet records the narrow ReEditPro active-baseline migration fix required after Qwen local harness validation retry 4. The retry proved `202605180002_reeditpro_media_source_sequence.sql` now applies past the prior `media_assets.status` prerequisite failure, then stopped before Qwen draft SQL because active migration `202605180003_reeditpro_intent_plan_versions.sql` referenced `edit_plan_segments.edit_plan_version_id` before that compatibility column existed on the older active baseline table.

The fix makes `202605180003_reeditpro_intent_plan_versions.sql` compatible with the older `public.edit_plan_segments` table created by `202605130002_intent_edit_planning_tables.sql`. It adds an idempotent nullable `public.edit_plan_segments.edit_plan_version_id` compatibility column before the migration creates `idx_edit_plan_segments_plan_order`. It does not backfill from `edit_plan_id`, because this migration must not invent `edit_plan_versions` records or silently create plan-version mappings. It does not recreate baseline tables, create a new migration, deploy a migration, touch Supabase cloud, start Supabase, start Docker, execute SQL, apply the Qwen draft SQL, run Qwen local SQL tests, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-4`
- Failed baseline migration: `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`
- Failed statement category: `idx_edit_plan_segments_plan_order`
- Sanitized failure: `column "edit_plan_version_id" does not exist (SQLSTATE 42703)`
- Media-assets status baseline fix verified: true
- Qwen draft SQL reached before fix: false
- Qwen local SQL tests reached before fix: false

## SQL Repair

The migration now prepares the existing active-baseline `edit_plan_segments` table before the later plan-order index runs:

- `public.edit_plan_segments.edit_plan_version_id`

The older active baseline column remains present and is not rewritten:

- `public.edit_plan_segments.edit_plan_id`

Backfill policy:

- `no_backfill_because_migration_must_not_invent_edit_plan_versions_records`

This preserves the existing ReEditPro baseline and gives the later RP-DATA-04 versioned plan index a stable `edit_plan_version_id` column without pretending older rows already have immutable plan-version mappings.

## Runtime Gates

- `baselineEditPlanSegmentsVersionFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `editPlanSegmentsVersionColumnGuarded=true`
- `editPlanSegmentsVersionBackfillSkipped=true`
- `editPlanSegmentsPlanOrderIndexUnblocked=true`
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

- The known active baseline `edit_plan_segments.edit_plan_version_id` prerequisite failure has a narrow source fix.
- The fix does not duplicate the ReEditPro `edit_plan_segments` table.
- The fix does not create plan-version rows, approval records, worker jobs, Qwen runtime tables, or generated assets.
- The next safe step is another local harness validation retry, not beta or production.

## What This Does Not Prove

- The full active ReEditPro baseline has not been reloaded after this fix in this packet.
- The Qwen draft SQL has not applied after this fix in this packet.
- The Qwen local SQL tests have not run after this fix in this packet.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AD-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-5: retry Qwen local harness validation after edit_plan_segments version baseline fix, no deploy/no cloud/no assets/no beta`
