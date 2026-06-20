# Blocked Scopes

The post-merge source-of-truth verification keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing and broad media runtime
- Track B media tool runtime, including OpenCV, PyAV, PySceneDetect, Sharp/libvips, PaddleOCR, PaddlePaddle, DuckDB, and Polars
- Sound/Music/Audio runtimes, including DeepFilterNet, FFmpeg/FFprobe audio execution, AudioFlux, Signalsmith Stretch, Lyria, Mirelo, MMAudio, internal SFX library execution, and Demucs
- AI Tools creative graphics execution
- AI image generation and AI image editing runtimes
- creative graphics provider/model calls
- Track A runtime execution
- Track A render/export runtime, Remotion rendering, mux/transcode execution, caption burn-in output, manifest writes, private GCS uploads, public delivery, and export worker execution
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, repair, or production promotion
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- beta or production unlocks

Blocked means no owner should treat the frozen-batch merge or this verification as runtime/product execution approval.

The `SOUND_MUSIC_AUDIO` TOOL-STUDY-0 completion is docs/diagnostics only. Demucs remains blocked pending provenance/legal/human approval, RNNoise is not active, and tool-route execution remains blocked until remaining owner studies and separate route execution gates pass.

The `AI_TOOLS_CREATIVE_GRAPHICS` TOOL-STUDY-0 completion is docs/diagnostics only. AI image generation planning, AI image editing planning, style transfer planning, thumbnails/covers/posters, title cards, lower thirds, overlays, typography/layout/composition metadata, brand/visual style metadata, graphic asset QA metadata, design prompt-to-intent routing, and creative graphics route/cost metadata do not unlock provider/model calls, image generation, image editing, workers, tools, routes, public artifacts, signed URLs, Supabase writes, beta, or production.

The `TRACK_A_RENDER_EXPORT` TOOL-STUDY-0 completion is docs/diagnostics only. Final timeline assembly planning, render/export planning, mux/transcode/container planning, codec quality profile planning, caption/subtitle/burn-in planning, overlay/title/lower-third placement handoff, audio/video sync handoff, preview/proxy/export QA metadata, artifact manifest/checksum/private GCS path planning, retention/delete/rollback planning, export cost/capacity metadata, and final export route/capability metadata do not unlock render/export runtime, workers, tools, routes, providers, media processing, GCS uploads, public artifacts, signed URLs, Supabase writes, beta, or production.

The `TOOL_STUDY_0_ROLLUP` completion is also docs/diagnostics only. It records `docs_diagnostics_complete:true` and decision `blocked_pending_owner_study_merge`; it does not unlock route execution, tool execution, worker execution, provider calls, media/audio/render/export execution, browser capture, map rendering, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompt execution, beta, production, dependency mutation, or PR merges.

<!-- TOOL_ROUTE_DRY_RUN_APPROVAL_STATUS -->

The tool-route dry-run approval packet does not unblock real execution. Tool execution, route execution, worker execution, provider calls, media/audio/render/image processing, browser capture, map rendering, Supabase writes, public artifacts, signed URLs, raw prompts, beta, paid production, and production remain blocked.

## Tool-Route Metadata Dry-Run Blocked Scopes

Real route execution, tool execution, worker execution, provider/model calls, media/audio/render/image/browser/map execution, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompt execution, external beta, paid production, and production remain blocked.

<!-- CONTROLLED_TOOL_EXECUTION_APPROVAL_STATUS -->

Controlled tool execution approval does not unblock real execution. Tool execution, route execution, worker execution, provider calls, media/audio/render/export/image/browser/map processing, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompt execution, dependency mutation, external beta, paid production, and production remain blocked.

<!-- FIRST_CONTROLLED_TOOL_EXECUTION_DRY_RUN_STATUS -->

The first controlled tool dry-run did not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.

<!-- NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_STATUS -->

The next controlled candidate review does not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.

<!-- SECOND_CONTROLLED_CANDIDATE_APPROVAL_STATUS -->

SECOND_CONTROLLED_CANDIDATE_APPROVAL:

- Decision: `approved_for_future_second_controlled_candidate_dry_run`.
- Approved future candidate: `controlled-tool:second_fixture_report_validation`.
- Fixture/route: `valid_sound_music_audio_metadata_route_candidate` / `metadata-route:sound_music_audio`.
- Owner lane: `SOUND_MUSIC_AUDIO`.
- Actual candidate execution remains future and separately approved.
- Broad tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.

<!-- SECOND_CONTROLLED_CANDIDATE_DRY_RUN_STATUS -->

The second controlled candidate dry-run did not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.

<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1_RERUN:

- Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.
- The Batch 1 rerun approval authorizes only a future no-install, no-lock-mutation proof execution packet.
- DuckDB, Polars, Sharp/libvips, FFmpeg, FFprobe, route/capability manifest validation, fixture/report validation, and inventory/proof matrix validation remain unrun by this packet.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1`.
- Real tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:end -->

<!-- OPEN_SOURCE_BATCH_1_EXECUTION_STATUS:start -->
The Batch 1 proof execution does not unblock missing optional tools or broad runtime. DuckDB, Polars, FFmpeg, and FFprobe remain unavailable in this environment until a separate install/proof review approves and lands them. Broad tool execution, route execution, worker execution, provider/model calls, real media/audio/render/image/browser/map work, Supabase/GCS writes, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.
<!-- OPEN_SOURCE_BATCH_1_EXECUTION_STATUS:end -->

<!-- OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW:

- Decision: `open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review`.
- Accepted central Batch 1 evidence: Sharp/libvips import/version proof, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.
- Missing optional tools: DuckDB local module, Polars local module, FFmpeg system binary, and FFprobe system binary.
- Missing optional tools are not counted as installed or proven.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW`.
- Real tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
<!-- OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW:

- Decision: `missing_optional_install_review_passed_ready_for_package_and_binary_approval`.
- DuckDB future package candidate: `duckdb`; not installed or proven here.
- Polars future package candidate: `nodejs-polars`; not installed or proven here.
- FFmpeg/FFprobe future strategy: system or worker-container binaries only; no npm wrapper and no media probing here.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL`.
- Real installs, package-lock mutation, import smoke, version probes, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
<!-- OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL:

- Decision: `missing_optional_package_and_binary_approval_passed_ready_for_execution`.
- DuckDB future package candidate: `duckdb`; not installed or proven here.
- Polars future package candidate: `nodejs-polars`; not installed or proven here.
- Future package command: `npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund`.
- FFmpeg/FFprobe future path: existing-binary check-only commands, with absence fail-closed unless a separate worker/container owner approval supplies binaries.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION`.
- Real installs, package-lock mutation, import smoke, version probes, fixture proofs, system binary installation, container mutation, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS:end -->

<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_EXECUTION_STATUS:start -->
The missing optional package/binary execution does not unblock broad runtime. DuckDB remains unproven until a separate package-install-script/native-binding review passes. FFmpeg and FFprobe remain missing system binaries until a separate system-binary or worker-container owner review passes. Media processing, worker execution, route execution, provider calls, Docker/container mutation, Supabase/GCS writes, public artifacts, signed URLs, raw prompts, dependency-script execution, external beta, paid production, and production remain blocked.
<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_EXECUTION_STATUS:end -->

<!-- OPEN_SOURCE_PACKAGE_INSTALL_SCRIPT_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW:

- Decision: `package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution`.
- Future DuckDB-only command, still not executed in this phase: `npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund`.
- Polars remains accepted from PR #455 and was not rerun here.
- DuckDB remains unproven until the native rebuild execution passes.
- FFmpeg/FFprobe remain separate system-binary review items.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION`.
- Runtime/product scopes remain blocked. Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_PACKAGE_INSTALL_SCRIPT_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_DUCKDB_NATIVE_REBUILD_QA_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW:

- Decision: `duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review`.
- DuckDB is accepted as installed/proven from PR #466 native rebuild, import/API, and in-memory query evidence.
- Polars remains accepted/proven from PR #455 and was not rerun in PR #466 or this QA phase.
- FFmpeg and FFprobe remain missing/unproven and route to `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW`.
- No npm install, npm rebuild, lifecycle script, proof rerun, version probe, tool/worker/route/provider/media, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_DUCKDB_NATIVE_REBUILD_QA_STATUS:end -->

<!-- OPEN_SOURCE_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW:

- Decision: `ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge`.
- DuckDB remains accepted/proven from PR #466 evidence; Polars remains accepted/proven from PR #455 evidence.
- FFmpeg and FFprobe remain missing/unproven in the central lane.
- PR #463 is relevant Track A FFmpeg/FFprobe/libass runtime-path evidence, but it is not present on the central source-of-truth branch and must be reconciled before central version-probe approval.
- Future FFmpeg/FFprobe version probes are not approved by this phase.
- Next prompt: `TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE`.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_STATUS:end -->

<!-- TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_STATUS:start -->
TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE:

- Decision: `tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval`.
- Reconciliation method: `docs_only_central_reconciliation`.
- PR #463 remains non-central Track A reference evidence; its diff was not replayed or cherry-picked.
- Central branch has `docker/prod/render-worker/Dockerfile`, but PR #463 Track A runtime-path reports/scripts are recorded as absent unless a later owner merge/replay lands them.
- FFmpeg and FFprobe remain not installed/proven centrally; future version probes are not approved by this phase.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL`.
- Supabase classification: no write / none / none / no.
<!-- TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_STATUS:end -->

<!-- OPEN_SOURCE_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL:

- Decision: `ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution`.
- Selected future runtime path: `tracka_repo_owned_render_worker_container` using `docker/prod/render-worker/Dockerfile`.
- Approved future commands for a separate execution packet: `ffmpeg -version` and `ffprobe -version`.
- Local host probing is not approved; FFmpeg/FFprobe are still not version-proven by this phase.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION`.
- No FFmpeg/FFprobe probe, Docker build/run, Docker/container mutation, media processing, caption burn-in, render/export, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_STATUS:end -->

<!-- OPEN_SOURCE_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION:

- Decision: `blocked_pending_exact_probe_command_source`.
- Selected runtime path: `tracka_repo_owned_render_worker_container`.
- Approved inner commands from PR #481: `ffmpeg -version` and `ffprobe -version`.
- Exact container invocation source: missing, so FFmpeg/FFprobe probes were not run.
- Local host probing remains not approved.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION`.
- No FFmpeg/FFprobe probe, Docker build/run, Docker/container mutation, media input/probe/decode/encode, caption burn-in, render/export, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS:end -->

<!-- Track A Container FFmpeg/FFprobe Probe Blocker Resolution:start -->
## Track A Container FFmpeg/FFprobe Probe Blocker Resolution

- Decision: `exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution`
- Prior blocker `blocked_pending_exact_probe_command_source` is resolved by defining exact future build-then-version-probe commands.
- Future path: Track A repo-owned render-worker Dockerfile, local no-push image tag, then container-only `ffmpeg -version` and `ffprobe -version`.
- Current phase execution: no FFmpeg/FFprobe, Docker build/run, local host probe, media processing, render/export, workers, routes, providers, Supabase, GCS, public artifacts, signed URLs, beta, or production.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION`.
<!-- Track A Container FFmpeg/FFprobe Probe Blocker Resolution:end -->

<!-- OPEN_SOURCE_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION:

- Decision: `blocked_pending_docker_build`.
- Selected runtime path: `tracka_repo_owned_render_worker_container`.
- Image tag: `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f`.
- Docker build run / exit: `true` / `1`.
- FFmpeg probe run / exit / version: `false` / `null` / `null`.
- FFprobe probe run / exit / version: `false` / `null` / `null`.
- Local host probing remains not approved and was not used.
- Media processing, caption burn-in, render/export, Docker image push, Dockerfile/container mutation, npm install/rebuild, DuckDB/Polars proof rerun, worker/route/provider execution, Supabase/GCS mutation, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION`.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_STATUS:end -->

<!-- tracka-docker-build-context-blocker-resolution:start -->
## Track A Docker Build Context Blocker Resolution

- Decision: `docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval`
- PR #494 blocker: missing Docker build-context directories for render-worker image COPY steps.
- Derived future build-context commands: `npm run build:server`, `npm run build:remotion-worker:mock`, `npm run build:staging-fixture-worker`, `npm run build:staging-real-video-export-worker`.
- Docker build/run and FFmpeg/FFprobe probes remain blocked until later separately approved phases.
- Generated `dist-*` outputs must remain uncommitted; `dist-staging-real-video-export-worker` is not ignored by current `.gitignore`, so future execution must remove or guard it explicitly.
- Supabase classification: no write / environment none / SQL none / migration no.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL`.
<!-- tracka-docker-build-context-blocker-resolution:end -->

<!-- tracka-build-context-generation-approval:start -->
## Track A Build Context Generation Approval

- Decision: `build_context_generation_approval_passed_ready_for_generation_execution`
- Approved next lane: build-context generation execution only.
- Future commands: `npm run build:server` -> `dist-server`, `npm run build:remotion-worker:mock` -> `dist-remotion-worker`, `npm run build:staging-fixture-worker` -> `dist-staging-fixture-worker`, `npm run build:staging-real-video-export-worker` -> `dist-staging-real-video-export-worker`.
- Generated outputs must be scanned, must remain uncommitted, and must be removed with `rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker` before commit.
- Docker build/run and FFmpeg/FFprobe probes remain blocked until later separately approved phases.
- Supabase classification: no write / environment none / SQL none / migration no.
- Absent broad production docs recorded as audit facts: `docs/beta-readiness-scorecard.md`, `docs/production-beta-blocker-inventory.md`, `PRODUCTION_FOUNDATION_STATUS.md`.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION`.
<!-- tracka-build-context-generation-approval:end -->

<!-- TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_STATUS -->

## Track A Build-Context Generation Execution

- Decision: `build_context_generation_execution_passed_ready_for_docker_build_probe_execution`
- Generated directories scanned and removed before commit: true
- Docker build/run and FFmpeg/FFprobe probes remain blocked: true
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN`
- Supabase: no write / environment none / SQL none / migration no

## Track A Container Docker Build FFmpeg/FFprobe Version-Probe Rerun - 2026-06-18T16:26:34.067Z

- Decision: `tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked`.
- Image tag: `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-9225347e636a50aa0ef241badbf51f9a3947b1f8`.
- Build-context outputs were local-only and must not be committed.
- Local-host probing, media processing, caption burn-in, render/export, Supabase/GCS, public artifact, signed URL, beta, and production scopes remain blocked.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW`.

## Track A Container FFmpeg/FFprobe Version-Probe QA Review

- Source SHA: `a0ad97abce12f7b8265feeaefa30390a41de03e4`
- Decision: `blocked_pending_docker_build_evidence_review`
- FFmpeg: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- FFprobe: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- Media processing, caption burn-in, render/export, worker execution, route execution, provider calls, public delivery, beta, and production remain blocked.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_BLOCKER_RESOLUTION`
- Supabase: no write / environment none / SQL none / migration no.

## Track A Container FFmpeg/FFprobe Version-Probe QA Review

- Source SHA: `a0ad97abce12f7b8265feeaefa30390a41de03e4`
- Decision: `rejected_due_runtime_safety_risk`
- FFmpeg: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- FFprobe: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- Media processing, caption burn-in, render/export, worker execution, route execution, provider calls, public delivery, beta, and production remain blocked.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_BLOCKER_RESOLUTION`
- Supabase: no write / environment none / SQL none / migration no.

## Track A Container FFmpeg/FFprobe Version-Probe QA Review

- Source SHA: `a0ad97abce12f7b8265feeaefa30390a41de03e4`
- Decision: `tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_media_processing_still_blocked_ready_for_batch1_rollup`
- FFmpeg: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- FFprobe: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).
- Media processing, caption burn-in, render/export, worker execution, route execution, provider calls, public delivery, beta, and production remain blocked.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF`
- Supabase: no write / environment none / SQL none / migration no.

## Open-Source Tool Stack Batch 1 Final Rollup After FFmpeg/FFprobe Proof

- Source SHA: `aed2a8ecc06b7a68a4139d38d3bb5f568a949ffc`
- Decision: `open_source_tool_stack_batch1_final_rollup_passed_media_processing_still_blocked_ready_for_batch2_planning`
- Accepted/proven Batch 1 targets: Sharp/libvips, DuckDB, Polars, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.
- FFmpeg and FFprobe: version-proven only for the Track A container path at `5.1.9-0+deb12u1`.
- Media processing, media file probing, caption burn-in, render/export, workers, routes, providers, Supabase/GCS, public delivery, beta, and production remain blocked.
- Primary next prompt: `OPEN_SOURCE_TOOL_STACK_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP`
- Secondary next prompt: `PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1`
- Supabase: no write / environment none / SQL none / migration no.

<!-- OPEN_SOURCE_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP_STATUS:start -->
## Open-Source Batch 2 Planning After Batch 1 Rollup

- Decision: `open_source_tool_stack_batch2_planning_passed_ready_for_owner_lane_reconciliation`.
- Batch 1 is centrally rolled up; FFmpeg/FFprobe are version-proven only for the Track A container path at `5.1.9-0+deb12u1`.
- Next primary prompt: `OPEN_SOURCE_TOOL_STACK_OWNER_LANE_RECONCILIATION_AFTER_BATCH_1_ROLLUP`.
- Secondary prompts: `OPEN_SOURCE_TOOL_STACK_BATCH_2_INSTALL_PROOF_APPROVAL`, `PRODUCT_INTERNAL_BETA_READINESS_AGGREGATION_AFTER_OPEN_SOURCE_BATCH_1`, `E2E_VALIDATION_QUEUE_BLOCKER_RESOLUTION_AFTER_OPEN_SOURCE_BATCH_1`.
- Media processing, render/export, worker/route/provider execution, Supabase/GCS/public artifact/signed URL delivery, beta, and production remain blocked.
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- OPEN_SOURCE_BATCH_2_PLANNING_AFTER_BATCH_1_ROLLUP_STATUS:end -->

## Owner-Lane Reconciliation After Batch 1 Rollup

- Decision: `owner_lane_reconciliation_passed_ready_for_staged_owner_merge_plan`.
- Central Batch 1 bounded proof remains accepted; owner-lane evidence is reconciled as metadata/dry-run/accepted-with-warnings only.
- 71 candidates remain inventoried; 13 AI graphics tools are accepted-with-warnings in the worker metadata lane.
- End-to-end product-ready tools remain `0`; do not claim 40+ tools are installed/proven end-to-end.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP`.
- Supabase classification: no write / environment none / SQL none / migration no.

<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:start -->
## Staged Owner Merge Plan After Batch 1 Rollup

Decision: `staged_owner_merge_plan_passed_ready_for_e2e_validation_pr305_hydration_blocker_resolution`.

Primary next prompt: `E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION`.

PR #523 is merged and now serves as source evidence for the unresolved PR #305 hydration blocker. PR #523 merged at 2026-06-19T02:04:29Z with merge commit f258967676c4877d3e1627b5710b789cff04b451. PR #305 remains blocked by pr_305_validation_blocked_npm_ci_failed. Merge-ready validations remain 0.

The staged plan keeps 71 candidates inventoried, Batch 1 bounded proof only, 13 AI graphics tools accepted-with-warnings in worker metadata dry-run scope only, and 0 end-to-end product-ready tools.

Do not claim 40+ tools are installed/proven end-to-end. Worker runtime, media processing, render/export, Supabase/GCS/public delivery, beta, and production remain blocked.
<!-- OPEN_SOURCE_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP:end -->

<!-- OPEN_SOURCE_TOOL_OWNER_REGISTRY_TRACKB_MEDIA_OSS_STEWARD:start -->
## Track B Media OSS Steward Owner Registry

The Track B Media OSS Steward registry does not unblock runtime behavior. The following remain blocked: media processing, media file probing, decode/encode, OCR execution, color/image processing, render/export, worker execution, route execution, provider calls, Supabase/SQL/GCS mutation, public artifacts, signed URLs, raw prompt execution, beta, and production.

Counts remain constrained: 16 owned Track B tools, 5 accepted/proven bounded Batch 1 tools, 11 blocked/not installed-proven tools, and 0 end-to-end product-ready tools.
<!-- OPEN_SOURCE_TOOL_OWNER_REGISTRY_TRACKB_MEDIA_OSS_STEWARD:end -->

<!-- TRACKB_MEDIA_OSS_INSTALL_PROOF_MILESTONE_PLAN:start -->
## Track B Media OSS Install/Proof Milestone Plan

The milestone plan does not run or unlock Track B runtime behavior. Dependency installs, package-lock mutation, Docker, FFmpeg/FFprobe probes, media file probing, media processing, decode/encode, OCR execution, image/color processing, render/export, worker execution, route execution, provider calls, Supabase/SQL/GCS mutation, public artifacts, signed URLs, raw prompt execution, beta, and production remain blocked in this phase.

Milestone 1 is future execution only and limited to tiny synthetic fixtures after a separate execution prompt.
<!-- TRACKB_MEDIA_OSS_INSTALL_PROOF_MILESTONE_PLAN:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION:

- Decision: `trackb_media_oss_milestone1_blocked_pending_container_packaging_approval`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Scope: ExifTool, MediaInfo, Tesseract, and ImageMagick/GraphicsMagick only.
- CPU/GPU policy: CPU-only/default; no GPU.
- Current result: system binary packaging approval is required before Milestone 1 can pass.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL`
- Supabase classification: no write / environment none / SQL none / migration no.

Blocked scopes remain: no FFmpeg/FFprobe, OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, OpenColorIO, OpenImageIO, real user media, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL:

- Decision: `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`.
- Future packaging target: `docker/prod/cpu-worker/Dockerfile`.
- Approved future packages: `libimage-exiftool-perl`, `mediainfo`, `tesseract-ocr`, `tesseract-ocr-eng`, `imagemagick`.
- GraphicsMagick role: optional fallback only; ImageMagick is the Milestone 1 default.
- Current phase execution: no package install, Dockerfile mutation, Docker build/run, tool execution, media processing, render/export, worker/route/provider execution, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION`.
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION:

- Decision: `trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Target: `docker/prod/cpu-worker/Dockerfile`
- Approved package set: `libimage-exiftool-perl`, `mediainfo`, `tesseract-ocr`, `tesseract-ocr-eng`, `imagemagick`
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed by default.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_BUILD_CONTEXT_BLOCKER_FOLLOWUP`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP:

- Decision: `trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Build-context outputs: `dist-server`, `dist-staging-fixture-worker` generated locally and cleaned before commit.
- Target Dockerfile: `docker/prod/cpu-worker/Dockerfile`
- Local image tag: `reeditpro-cpu-worker:trackb-milestone1-cd4e5f0e234c4ff4bf3cefacba84a2f31530c3e8`
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed or proven by default.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_FOLLOWUP_BLOCKER_REVIEW`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:end -->

<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:start -->
Decision: `trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa`.
Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW`.
PR #557 evidence remains accepted for ExifTool, MediaInfo, ImageMagick, Docker build, build-context generation, and Tesseract version proof.
Tesseract fixture proof accepted variant: `dejavu_sans_bold_large_psm7`.
Track B end-to-end product-ready tools remain `0`; do not claim 40+ tools are installed/proven end-to-end.
Supabase classification: no write / none / none / no.
<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:end -->
