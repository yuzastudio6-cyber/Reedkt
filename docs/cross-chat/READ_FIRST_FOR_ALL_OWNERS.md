# Read First For All Owners

PR #350 has completed frozen-batch merge execution and post-merge source-of-truth verification.

Current coordination facts:

1. The frozen batch of 27 PRs is merged and verified with `mergedAt`.
2. Source branches for all 27 frozen PRs still exist.
3. Key milestone reports are reachable from the merged branch chain.
4. Runtime, worker/tool/route, provider, Supabase write, public artifact, signed URL, raw prompt, production, external beta, and paid production scopes remain blocked.
5. `TRACK_B_MEDIA_PROCESSING` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-track-b-media-processing` as docs/diagnostics only.
6. `SOUND_MUSIC_AUDIO` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-sound-music-audio-clean` as docs/diagnostics only.
7. `AI_TOOLS_CREATIVE_GRAPHICS` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-ai-tools-creative-graphics-clean` as docs/diagnostics only.
8. `TRACK_A_RENDER_EXPORT` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-track-a-render-export-clean` as docs/diagnostics only.
9. All TOOL-STUDY-0 owner studies are complete only after their diagnostics pass; tool-route execution remains blocked pending a separate route-unlock readiness check and explicit route execution gate.
10. `TOOL_STUDY_0_ROLLUP` records docs/diagnostics completeness as `true` but route-unlock readiness remains `blocked_pending_owner_study_merge` until PR #367, #373, #376, and #379 merge into source-of-truth.

Read `docs/github-merge-hygiene/post-merge-source-of-truth-verification.md` before building on merged milestone evidence.

Track B study completion does not unlock runtime, media processing, provider calls, workers, tools, routes, Supabase writes, public artifacts, signed URLs, internal beta, external beta, paid production, production, or raw prompt execution.

Sound/Music/Audio study completion also does not unlock DeepFilterNet, FFmpeg, AudioFlux, Signalsmith Stretch, Demucs, Lyria, Mirelo, MMAudio, internal SFX library runtime, provider calls, audio processing, media processing, workers, routes, public artifacts, signed URLs, beta, or production.

AI Tools Creative Graphics study completion also does not unlock provider/model calls, image generation, image editing, style transfer runtime, creative graphics execution, workers, tools, routes, public artifacts, signed URLs, Supabase writes, beta, or production.

Track A Render/Export study completion also does not unlock render/export execution, Remotion rendering, mux/transcode execution, caption burn-in output, private GCS uploads, manifest writes, public delivery, signed URLs, workers, tools, routes, Supabase writes, beta, or production.

TOOL-STUDY-0 completion rollup does not merge PRs and does not unlock tool-route execution. Its current output is docs/diagnostics complete with merged source-of-truth still pending.

<!-- SECOND_CONTROLLED_CANDIDATE_APPROVAL_STATUS -->

SECOND_CONTROLLED_CANDIDATE_APPROVAL:

- Decision: `approved_for_future_second_controlled_candidate_dry_run`.
- Approved future candidate: `controlled-tool:second_fixture_report_validation`.
- Fixture/route: `valid_sound_music_audio_metadata_route_candidate` / `metadata-route:sound_music_audio`.
- Owner lane: `SOUND_MUSIC_AUDIO`.
- Actual candidate execution remains future and separately approved.
- Broad tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.

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
