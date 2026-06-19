# Owner Matrix

| Workstream | Current owner action | Merge hygiene note |
| --- | --- | --- |
| Cross-chat coordination | Review canonical merge order and duplicate risk register | This PR owns audit metadata only |
| Foundation/Supabase | Confirm clean-staging and Track B parent chain before merge | No Supabase writes or migrations are authorized here |
| Product internal testing | Merge parent PRs before session and start-gate children | Internal testing remains restricted metadata/readiness scope |
| Model orchestration | Confirm Qwen/DeepSeek evidence chain before plan snapshot children | Provider calls remain outside this audit |
| Worker runtime | Hold draft worker no-op PRs until parent chain and draft status are resolved | No worker, Docker, Cloud Run, tool, or route execution is authorized |
| Track A creative graphics | Review parallel creative graphics lanes before merge | Runtime and media execution remain blocked |
| SUPABASE_SOUND audio harness | Review audio/SoundSync harness ancestry and duplicates | Audio runtime and Supabase mutation remain blocked |
| TRACK_B_MEDIA_PROCESSING | TOOL-STUDY-0 complete as docs/diagnostics only | Covers OCR/CV/media metadata routing only; no media processing, tool execution, worker execution, Supabase write, or beta/production unlock |
| SOUND_MUSIC_AUDIO | TOOL-STUDY-0 complete as docs/diagnostics only | Owns DeepFilterNet, FFmpeg/FFprobe audio planning, AudioFlux, Signalsmith Stretch, Demucs blocked review, music/SFX/audio metadata routing; no audio runtime, provider, worker, route, Supabase, beta, or production unlock |
| AI_TOOLS_CREATIVE_GRAPHICS | TOOL-STUDY-0 complete as docs/diagnostics only | Owns creative graphics planning, AI image generation planning, image editing planning, style transfer planning, thumbnails/covers/posters, title cards, lower thirds, overlays, brand/typography/layout metadata, and graphic asset QA metadata; no provider/model, image generation/editing, tool, worker, route, public artifact, signed URL, Supabase, beta, or production unlock |
| TRACK_A_RENDER_EXPORT | TOOL-STUDY-0 complete as docs/diagnostics only | Owns final timeline assembly planning, render/export planning, mux/transcode/container planning, codec profile planning, caption/subtitle/burn-in planning, overlay/audio sync handoff, private artifact manifest/checksum planning, private GCS path planning, retention/delete/rollback planning, and export cost/capacity metadata; no render/export runtime, worker, route, public artifact, signed URL, Supabase, beta, or production unlock |
| TOOL_STUDY_0_ROLLUP | Docs/diagnostics complete, blocked pending owner-study merge | Owns completion rollup and route-unlock readiness metadata; does not merge PRs, execute routes, execute tools/workers/providers, mutate Supabase, create public artifacts, create signed URLs, or unlock beta/production |

## AI Graphics Owner Assignment Registry

| Workstream | Current owner action | Merge hygiene note |
| --- | --- | --- |
| AI_TOOLS_CREATIVE_GRAPHICS | `atlas_ai_graphics_worker_owner` / Atlas — AI Graphics & Worker Metadata Owner registered as `pending_duplicate_review` | Coordinates AI graphics and Worker metadata ownership only; `exclusiveOwnershipClaimed:false`, runtime/beta/production remain blocked |
| TRACK_B_MEDIA_PROCESSING | `TRACK_B_MEDIA_OSS_STEWARD` / Track B Media OSS Steward owns Track B media tools | Atlas may reference Track B evidence but cannot claim, install, prove, or execute FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars/nodejs-polars, OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick/GraphicsMagick, Tesseract, OpenColorIO, or OpenImageIO |
