# AI_TOOLS_CREATIVE_GRAPHICS Routing Policy

Decision: `ai_tools_creative_graphics_tool_study_passed_docs_only`

## Allowed In This Study

- docs and diagnostics
- source-of-truth audit facts
- metadata-only creative graphics route planning
- private placeholder refs
- owner handoff fields for future approved plan snapshots

## Blocked In This Study

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- modelExecutionAllowed: false
- toolExecutionAllowed: false
- imageGenerationAllowed: false
- imageEditingAllowed: false
- mediaProcessingAllowed: false
- browserCaptureAllowed: false
- mapRenderingAllowed: false
- supabaseWritesAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false
- dependencyMutationAllowed: false
- rawPromptExecutionAllowed: false

## Routing Rules

Use `AI_TOOLS_CREATIVE_GRAPHICS` when a planned beat needs creative visual design metadata: still images, keyframes, cards, title cards, lower thirds, overlays, thumbnails, posters, visual style, brand look, character anchor planning, image-edit briefs, or graphic QA metadata.

Use `TRACK_B_MEDIA_PROCESSING` for source media metadata, OCR, CV, scene detection, PyAV, PySceneDetect, OpenCV, Sharp/libvips, DuckDB, Polars, PaddleOCR, PaddlePaddle, and route/capability manifests.

Use `SOUND_MUSIC_AUDIO` for audio cleanup, FFmpeg/FFprobe audio planning, DeepFilterNet, AudioFlux, Signalsmith Stretch, SoundSync cues, SFX/music planning, and Demucs blocked review.

Use map/web owner studies for web capture, map/geospatial, browser screenshots, map tiles, route geometry, and geospatial source certainty.

Use `PROVIDER_GATEWAY` for any future model/provider request; this study can name route candidates as metadata only.

Use `WORKER_RUNTIME_JOBS` for any future job intake or worker lifecycle.

Use `TRACK_A_RENDER_EXPORT` for final composition, render/export, muxing, delivery, export QC, and public/private artifact delivery policy.

Use `SUPABASE_RLS_STORAGE_DATABASE` for future source-of-truth rows, RLS, storage, and migration work; this study performs no write.

Signed URLs are never source of truth.
