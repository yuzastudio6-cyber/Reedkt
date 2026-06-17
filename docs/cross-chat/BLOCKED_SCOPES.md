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

<!-- AI_TOOLS_CREATIVE_GRAPHICS_OPEN_SOURCE_TOOL_STACK_OWNER_AUDIT_STATUS -->

The `AI_TOOLS_CREATIVE_GRAPHICS` open-source tool stack owner audit does not unblock real execution. Dependency mutation, package-lock mutation, import probes, E2E synthetic proof execution, model-weight download, model execution, tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.

<!-- TOOL_ROUTE_AI_GRAPHICS_METADATA_INTEGRATION_APPROVAL_STATUS -->

The `TOOL_ROUTE_AI_GRAPHICS_METADATA_INTEGRATION` approval packet does not unblock real execution. It approves future metadata-only route registry intake, scoped tool-call manifest intake, and Worker Runtime handoff planning only. Dependency mutation, package-lock mutation, import probes, synthetic fixture execution, actual tool execution, route execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.

<!-- TOOL_ROUTE_AI_GRAPHICS_METADATA_INTEGRATION_QA_STATUS -->

The `TOOL_ROUTE_AI_GRAPHICS_METADATA_INTEGRATION` QA review does not unblock real execution. It accepts metadata-only Tool Route intake with warnings and recommends local fixture planning next. Dependency mutation, package-lock mutation, imports, fixture execution, actual tool execution, route execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
