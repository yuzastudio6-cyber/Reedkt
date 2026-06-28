# Qwen2.5-VL 7B Backend Runtime Persistence Baseline Migration Fix

Decision: `qwen2_5_vl_backend_runtime_persistence_baseline_migration_fix_qualified_seed_description`.

This packet records the narrow ReEditPro active-baseline migration fix required after the Qwen local harness validation retry. The retry reached active migration `202605130007_generation_providers_generated_assets.sql` and stopped before Qwen draft SQL because a seed `select` used an unqualified `description` column while both `generation_providers gp` and the lateral `seed` relation expose `description`.

The fix qualifies the model seed projection with `seed.description` and the related seed fields. It does not create a new migration, deploy a migration, touch Supabase cloud, start Supabase, start Docker, execute SQL, apply the Qwen draft SQL, run Qwen local SQL tests, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Context

- Source branch input: `codex/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry`
- Failed baseline migration: `supabase/migrations/202605130007_generation_providers_generated_assets.sql`
- Failed statement category: `generation_provider_models` seed insert
- Sanitized failure: `column reference "description" is ambiguous (SQLSTATE 42702)`
- Qwen draft SQL reached before fix: false
- Qwen local SQL tests reached before fix: false

## SQL Repair

The model seed insert now projects explicit seed columns:

- `seed.model_key`
- `seed.model_name`
- `seed.display_name`
- `seed.description`
- `seed.default_quality_level`
- `seed.supports_transparent_background`
- `seed.supports_word_level_timing`
- `seed.supports_seed`
- `seed.payload`

This preserves the existing provider model seed rows and avoids binding `description` to `generation_providers.description`.

## Runtime Gates

- `baselineMigrationFixRecorded=true`
- `activeBaselineMigrationEdited=true`
- `ambiguousDescriptionReferenceFixed=true`
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

- The known active baseline ambiguity from the Qwen local harness retry has a narrow source fix.
- The fix does not duplicate generation provider schema, create Qwen runtime tables, or change provider/model routing policy.
- The next safe step is another local harness validation retry, not beta or production.

## What This Does Not Prove

- The full active ReEditPro baseline has not been reloaded after this fix in this packet.
- The Qwen draft SQL has not applied after this fix in this packet.
- The Qwen local SQL tests have not run after this fix in this packet.
- Real worker dispatch remains blocked.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58X-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-2: retry Qwen local harness validation after baseline migration fix, no deploy/no cloud/no assets/no beta`
