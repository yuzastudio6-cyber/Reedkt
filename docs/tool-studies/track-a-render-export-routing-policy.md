# TRACK_A_RENDER_EXPORT Routing Policy

Decision: `track_a_render_export_tool_study_passed_docs_only`

## Allowed In This Study

- docs and diagnostics
- source-of-truth audit facts
- metadata-only render/export route planning
- private placeholder refs
- owner handoff fields for future approved plan snapshots
- future artifact manifest/checksum/private-path planning

## Blocked In This Study

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- modelExecutionAllowed: false
- toolExecutionAllowed: false
- renderExecutionAllowed: false
- exportExecutionAllowed: false
- mediaProcessingAllowed: false
- browserCaptureAllowed: false
- mapRenderingAllowed: false
- supabaseWritesAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false
- dependencyMutationAllowed: false
- rawPromptExecutionAllowed: false

## Routing Rules

Use `TRACK_A_RENDER_EXPORT` when a planned beat needs final timeline assembly, render/export planning, mux/transcode/container planning, codec profile planning, caption/subtitle/burn-in planning, overlay placement handoff, audio/video sync handoff, preview/proxy/export QA metadata, private artifact manifest/checksum planning, private GCS path planning, retention/delete/rollback planning, export cost/capacity metadata, or final export route/capability metadata.

Use `TRACK_B_MEDIA_PROCESSING` for source media metadata, OCR, CV, scene detection, PyAV, PySceneDetect, OpenCV, Sharp/libvips, DuckDB, Polars, PaddleOCR, PaddlePaddle, and Track B route/capability manifests.

Use `SOUND_MUSIC_AUDIO` for audio cleanup, FFmpeg/FFprobe audio planning, DeepFilterNet, AudioFlux, Signalsmith Stretch, SoundSync cues, SFX/music planning, and Demucs blocked review.

Use `AI_TOOLS_CREATIVE_GRAPHICS` for creative graphic assets, image generation planning, image editing planning, style transfer planning, title cards, lower thirds, overlays, typography/layout/composition metadata, and graphic asset QA metadata.

Use `PROVIDER_GATEWAY` for future model/provider requests; this study can name provider-owned dependencies as metadata only.

Use `WORKER_RUNTIME_JOBS` for future job intake, worker lifecycle, and any real render/export execution.

Use `PUBLIC_ARTIFACT_DELIVERY` for future public artifact delivery, signed URL policy, download URLs, and share/export delivery behavior.

Use `SUPABASE_RLS_STORAGE_DATABASE` for future source-of-truth rows, RLS, storage, migrations, and service-role boundaries; this study performs no write.

Signed URLs are never source of truth. Future render/export source-of-truth refs must be approved snapshot refs, Supabase row refs, private artifact manifest IDs, checksums, and private GCS path refs.
