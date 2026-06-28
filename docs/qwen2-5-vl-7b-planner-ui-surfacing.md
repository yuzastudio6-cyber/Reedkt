# QWEN2_5_VL 7B Planner UI Surfacing

## Status

Decision: `qwen_vl_planner_ui_surfacing_mock_only`

This packet surfaces Qwen2.5-VL planner-routing choices inside the chat-native mock planning UI. It does not call Qwen, invoke Cloud Run, dispatch workers, run inference, download model weights, create generated assets, mutate Supabase, create signed URLs, create public artifacts, process media, render, export, spend credits, unlock beta, or unlock production.

## UI Scope

The accepted UI surface is `ChatNativeEditor.tsx`. The Qwen routing card appears beside the existing controlled tool strategy planning card and uses frontend-safe deterministic metadata from `src/lib/qwen-vl-planner-routing-ui.ts`.

The UI is developer-detail planning evidence. It is hidden in compact guided mode and visible in detailed/developer planning views through the normal chat card descriptor flow.

## Planner Route Summary

The UI presents 13 planner-routing tasks and one private-invoke dry-run route readiness surface:

- 4 primary Qwen metadata routes for visual understanding, product/demo step context, B-roll relevance scoring, and generated asset visual QA.
- 4 advisory Qwen metadata routes for caption visual consistency, OCR layout context, chart/screen context, and safe-zone semantic signal review.
- 5 blocked routes for AI video generation, final render/export, raw chat execution, frontend invocation, and unbounded long-video analysis.
- Private invoke client route: `jobs.qwen2_5_vl.privateInvoke.dryRun`
- Private invoke client helper: `callQwen25VlPrivateInvokeDryRun`
- Private invoke status: `backend_runtime_persistence_local_harness_validation_retry_after_qa_reports_approved_snapshot_fix_required`

The card keeps `dryRunPassedClaimed=false` and all execution gates false.

## Ownership Boundaries

- Qwen is visual understanding and visual QA metadata only.
- Wan, LTX, Mochi, and Hunyuan own generated B-roll/video routes.
- PaddleOCR and OpenCV own deterministic OCR, frame regions, safe-zone evidence, and sampling primitives.
- D3, ECharts, and Vega-Lite own exact chart and dataviz output.
- Remotion owns final layout and composition.
- FFmpeg and ffprobe own media/export integrity.

The UI must not present Qwen as an OCR authority, video generator, renderer, exporter, provider gateway, storage path, signed URL source, public artifact source, or worker execution trigger.

## Runtime Gates

All UI data keeps these false:

- planner worker dispatch
- Cloud Run invocation
- inference
- model download
- generated asset creation
- public artifact creation
- signed URL creation
- render/export
- raw prompt execution
- service URL resolution
- auth header creation
- identity token fetch
- service runtime request send
- credit mutation

The card provides no execution buttons, no approval buttons, no credit buttons, no upload/publish buttons, and no worker/provider action labels.

## Current Blocker

Read-only Cloud Run auth/IAM reverify has passed, narrow TokenCreator and Run Invoker bindings are in place, and the controlled caller can mint an audience-bound identity token without printing or storing the token value. The earlier bounded local request returned HTTP `404` because the service ingress is `internal-and-cloud-load-balancing`. The internal caller harness plan selected a CPU-only Cloud Run Job with Direct VPC egress as the preferred no-idle-GPU path. The Direct VPC route config created a dedicated future-caller subnet with Private Google Access enabled and left the default subnet unchanged. The CPU-only caller source is defined with no model loader, no vLLM runtime, no CUDA dependency, and no inference path. The controlled caller job is deployed, one caller contract smoke observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`, runtime readiness review is recorded, the first approved-fixture inference smoke plan is defined, gated fixture inference service source is deployed, and the first controlled approved-fixture smoke failure is documented. The tuned retry observed HTTP `200` with `qwen_fixture_inference_smoke_completed` and stored only sanitized metadata output evidence. Result review accepted the invocation, private model-cache load, vLLM initialization, and bounded L4 fixture profile, but blocked runtime readiness because `parsedJson=false`, `schemaKeys=[]`, `objectCount=0`, and `textLikeRegionCount=0`. The service source now defines `qwen_fixture_visual_metadata_v1`, JSON extraction, metadata normalization, schema validity summaries, and a CPU caller pass condition that requires `parsedJson=true` and `schemaValid=true`. The controlled structured-output retry passed with `parsedJson=true`, `schemaValid=true`, `objectCount=3`, `textLikeRegionCount=1`, `spatialRelationCount=2`, and `blockedActionCount=4`; raw model output text remains out of the repo. The structured-output result review accepted the schema keys, row counts, normalized metadata hash, and raw-output exclusion as metadata evidence. Private runtime review accepted the controlled L4 runtime evidence for metadata-only fixture readiness. Approved worker integration review accepted the local queue contract, fail-closed dispatch adapter, private invoke plan/config, structured fixture metadata, and private runtime evidence. Backend runtime dispatch implementation plan is recorded. Fail-closed backend runtime dispatch coordinator is implemented and composes schema validation, approved snapshot checks, credit checks, source-of-truth checks, idempotency, lease precondition, Qwen adapter, private invoke envelope, and transport preview without runtime side effects. Controlled backend dispatch dry-run review covers all eight coordinator outcomes with no runtime side effects. Backend runtime persistence plan maps Qwen dispatch to existing approved snapshot, credit reservation, job, event, worker runtime config, worker lease, runtime message, claim, idempotency, private storage record, signed URL audit, tool check, QA, and audit surfaces. Backend runtime persistence schema draft review confirms Qwen should reuse those existing surfaces and defines Qwen-specific worker type, job type, idempotency, payload, source-of-truth, lease/claim, RLS, event sanitization, and cleanup constraints. Backend runtime persistence migration draft and local SQL tests are recorded without active migrations, SQL execution, Supabase mutation, or runtime execution. Backend runtime persistence local validation result is recorded as blocked because this worktree previously had no `supabase/config.toml` or approved local/non-production database harness. Backend runtime persistence local harness plan is recorded, rejects plain PostgreSQL, cloud/staging/production, live data, and manual platform stubs, and requires a safe repo-local Supabase config before any validation run. Safe repo-local Supabase config text is now created and verified with loopback-only values, compatible local arm64 Node and Supabase CLI, and Docker CLI availability. Backend runtime persistence local harness validation was attempted and stopped before SQL because port `54322` is already allocated by an existing local `reeditpro` Supabase stack. The Qwen local harness config now uses non-conflicting ports `55430`, `55431`, `55432`, `55433`, and `55434`. Backend runtime persistence local harness validation retry was attempted and stopped before Qwen draft SQL because active ReEditPro baseline migration `202605130007_generation_providers_generated_assets.sql` failed with `column reference "description" is ambiguous (SQLSTATE 42702)`. The baseline migration fix qualifies `seed.description` and related seed fields. Backend runtime persistence local harness validation retry 2 verified that the generation-provider baseline migration now advances, then stopped before Qwen draft SQL because active migration `202605180001_reeditpro_core_workspace_projects.sql` references `projects.current_edit_session_id` before that column exists. The current edit session baseline fix is recorded and retry 3 verified that migration now applies, then stopped before Qwen draft SQL because active migration `202605180002_reeditpro_media_source_sequence.sql` references `media_assets.status` before that compatibility column exists on the older active baseline table. The media-assets status baseline fix is recorded and retry 4 verified that migration now applies, then stopped before Qwen draft SQL because active migration `202605180003_reeditpro_intent_plan_versions.sql` references `edit_plan_segments.edit_plan_version_id` before that compatibility column exists on the older active baseline table. The edit-plan-segments version baseline fix is recorded and retry 5 verified that migration now applies, then stopped before Qwen draft SQL because active migration `202605180004_reeditpro_credits_approval_snapshots.sql` references `credit_reservations.approved_plan_snapshot_id` before that compatibility column exists on the older active baseline table. The credit approval snapshots baseline fix is recorded and guards `credit_reservations.approved_plan_snapshot_id`, `credit_ledger_entries.approved_plan_snapshot_id`, and `approval_records.approved_snapshot_id` without backfill. Retry 6 verified that the credit approval snapshots fix now advances past that approved-snapshot reference blocker, then stopped before Qwen draft SQL at `idx_credit_estimates_project_plan` because `credit_estimates.edit_plan_version_id` does not exist on the older active baseline table. The credit estimates plan-version baseline fix is recorded and guards `credit_estimates.edit_plan_version_id` before `idx_credit_estimates_project_plan` without backfill. Retry 7 verified that `idx_credit_estimates_project_plan` now advances, then stopped before Qwen draft SQL at `idx_generation_requests_project_snapshot` because `generation_requests.approved_plan_snapshot_id` does not exist on the older active baseline table. The generation requests approved-snapshot baseline fix is recorded and guards `generation_requests.approved_plan_snapshot_id` before `idx_generation_requests_project_snapshot` without backfill. Retry 8 verified that `idx_generation_requests_project_snapshot` now advances, then stopped before Qwen draft SQL at `idx_generated_asset_versions_asset_version` because `generated_asset_versions.version` does not exist on the older active baseline table while `version_number` does. The generated asset versions version baseline fix is recorded and guards `generated_asset_versions.version` before `idx_generated_asset_versions_asset_version` without backfill. Retry 9 verified that `idx_generated_asset_versions_asset_version` now advances, then stopped before Qwen draft SQL because active migration `202605180006_reeditpro_qa_exports_audit.sql` declares `qa_check_results.check` as an unquoted reserved column. The QA check-results reserved-column fix is recorded and quotes the preserved legacy column as `"check" text`. Retry 10 verified that parser fix, then stopped before Qwen draft SQL at `idx_qa_reports_project_snapshot` because `qa_reports.approved_plan_snapshot_id` is missing on the older active baseline table. The QA reports approved-snapshot baseline fix is now recorded and guards `qa_reports.approved_plan_snapshot_id` plus `qa_reports_approved_plan_snapshot_id_fkey` without backfill. User-facing readiness remains blocked until local harness validation retry 11 runs after that fix; beta, production, arbitrary media, generated assets, public artifacts, signed URLs, and raw prompt execution remain disabled.

The QA reports approved-snapshot baseline fix is now recorded in `202605180006_reeditpro_qa_exports_audit.sql`: `qa_reports.approved_plan_snapshot_id` is added idempotently and `qa_reports_approved_plan_snapshot_id_fkey` is guarded before `idx_qa_reports_project_snapshot` runs. It does not backfill QA reports or invent approved snapshots, generated assets, worker rows, credit records, provider outputs, or Qwen runtime records. Retry 11 is required to prove whether the active baseline now reaches Qwen draft SQL.

Historical retry evidence remains preserved: retry 7 stopped in `202605180005_reeditpro_generation_assets_jobs.sql` at `idx_generation_requests_project_snapshot` because `generation_requests.approved_plan_snapshot_id` was missing on the older active baseline, retry 8 moved the blocker to `idx_generated_asset_versions_asset_version`, retry 9 moved it to the QA check-results reserved-column fix, retry 10 moved it to `qa_reports.approved_plan_snapshot_id`, and the next gated validation is retry 11.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58AP-BACKEND-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11: retry Qwen local harness validation after qa_reports approved-snapshot baseline fix, no deploy/no cloud/no assets/no beta`
