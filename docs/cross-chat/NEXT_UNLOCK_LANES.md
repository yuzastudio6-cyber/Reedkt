# Next Unlock Lanes

Recommended next phase:

- Run `TOOL-STUDY-0 completion rollup and route-unlock readiness check` before any tool-route execution unlock.

Owner study status:

- `TRACK_B_MEDIA_PROCESSING`: complete after `tool-study:track-b-media-processing:diagnostics` passes.
- `SOUND_MUSIC_AUDIO`: complete after `tool-study:sound-music-audio:diagnostics` passes.
- `AI_TOOLS_CREATIVE_GRAPHICS`: complete after `tool-study:ai-tools-creative-graphics:diagnostics` passes.
- `TRACK_A_RENDER_EXPORT`: complete after `tool-study:track-a-render-export:diagnostics` passes.

No TOOL-ROUTE execution unlock can proceed until a separate explicit route-unlock readiness check and route dry-run approval packet are accepted.

TOOL-STUDY-0 completion rollup:

- Decision: `blocked_pending_owner_study_merge`
- Docs diagnostics complete: `true`
- Merged source-of-truth complete: `false`
- Pending source-of-truth PRs: `#367`, `#373`, `#376`, `#379`
- Route unlock ready: `false`

Post-merge source-of-truth verification decision: `post_merge_source_of_truth_verification_passed`

Still blocked:

- runtime execution
- provider calls
- worker/tool/route execution
- Supabase writes
- production, external beta, and paid production
- public artifacts and signed URL delivery
- raw prompt execution
- media processing
- audio processing
- dependency mutation

Next recommended phase: merge/source-of-truth completion for the owner-study stack. After those PRs merge and diagnostics remain passing, the next prompt is `TOOL_ROUTE_EXECUTION - tool-route dry-run approval packet`.

<!-- TOOL_ROUTE_DRY_RUN_APPROVAL_STATUS -->

Next unlock lane after TOOL-STUDY-0 source-of-truth merge:

- `TOOL_ROUTE_EXECUTION - tool-route metadata dry-run execution` may proceed only after this approval packet is accepted.
- Real execution remains blocked pending separate controlled execution gates.

## Tool-Route Metadata Dry-Run

Next lane: CONTROLLED_TOOL_EXECUTION controlled tool execution approval packet. This is approval-only until separately authorized.

<!-- CONTROLLED_TOOL_EXECUTION_APPROVAL_STATUS -->

Next unlock lane:

- `CONTROLLED_TOOL_EXECUTION - first controlled tool execution dry-run` may use only the selected fixture/report-validation candidate after separate approval.
- Media/audio/render/image/browser/map, workers, providers, Supabase/GCS writes, public artifacts, signed URLs, beta, and production remain blocked.

<!-- FIRST_CONTROLLED_TOOL_EXECUTION_DRY_RUN_STATUS -->

Next unlock lane:

- `NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW` may choose another low-risk candidate approval or worker handoff review.
- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

<!-- NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_STATUS -->

Next unlock lane:

- `SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL` may approve only `controlled-tool:second_fixture_report_validation` using the Sound/Music/Audio metadata fixture.
- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

<!-- SECOND_CONTROLLED_CANDIDATE_APPROVAL_STATUS -->

SECOND_CONTROLLED_CANDIDATE_APPROVAL:

- Decision: `approved_for_future_second_controlled_candidate_dry_run`.
- Approved future candidate: `controlled-tool:second_fixture_report_validation`.
- Fixture/route: `valid_sound_music_audio_metadata_route_candidate` / `metadata-route:sound_music_audio`.
- Owner lane: `SOUND_MUSIC_AUDIO`.
- Actual candidate execution remains future and separately approved.
- Broad tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.

<!-- SECOND_CONTROLLED_CANDIDATE_DRY_RUN_STATUS -->

Next unlock lane:

- `NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_AFTER_SECOND` may choose another low-risk candidate approval or worker handoff review.
- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1_RERUN:

- Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.
- The central `@emnapi/*` lock metadata mismatch is repaired and Batch 1 rerun approval is complete.
- Next lane is a separate no-install, no-lock-mutation proof execution packet for the eight selected Batch 1 candidates.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1`.
- Real tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:end -->

<!-- OPEN_SOURCE_BATCH_1_EXECUTION_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1:

- Decision: `open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools`.
- Next lane: `OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW`.
- Missing optional tools require a separate install/proof review before they can count as locally available.
- Broad tool execution, route execution, workers, providers, media/audio/render/image/browser/map work, Supabase/GCS writes, public artifacts, signed URLs, raw prompts, external beta, paid production, and production remain blocked.
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
OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION:

- Decision: `missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts`.
- Next lane: `OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW`.
- Polars is locally proven for metadata-only dataframe construction; DuckDB still needs a separate script/native-binding review before it can count as proven.
- FFmpeg/FFprobe remain missing system-binary targets and require separate system/worker-container review before version proof can pass.
- Broad tool execution, media/audio/render/image/browser/map work, workers, routes, providers, Docker/container mutation, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.
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
