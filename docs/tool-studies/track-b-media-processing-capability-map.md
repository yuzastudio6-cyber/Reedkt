# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Capability Map

Every capability below is planning-only. No tool, route, worker, provider, Supabase, media, public artifact, signed URL, beta, or production path is enabled.

| Capability | Primary Track B Tool(s) | Purpose | Safe Inputs | Safe Outputs | Readiness | Blocked Uses |
| --- | --- | --- | --- | --- | --- | --- |
| `ocr_text_in_frame_planning` | `paddleocr`, `paddlepaddle`, `opencv` preprocessing metadata | Plan text-region detection for caption, lower-third, source-label, and proof-card collision review. | Approved frame refs, bounded fixture refs, OCR model evidence refs. | OCR manifest, text-region QA metadata, confidence policy. | `planning_ready_restricted` | OCR execution, raw media OCR, fact validation. |
| `frame_image_analysis_planning` | `opencv`, `sharp_libvips` | Plan blur, crop, safe-zone, quality, object-region, and panel consistency checks. | Frame refs, image derivative refs, checksum refs. | Frame analysis manifest, safe-zone QA metadata. | `planning_ready_restricted` | OpenCV execution, semantic claims, broad media processing. |
| `scene_detection_planning` | `pyscenedetect`, `pyav` | Plan scene/shot boundary candidate extraction and pacing references. | Clip refs, timecode refs, threshold policy. | Scene detection manifest, boundary candidate report. | `planning_ready_restricted` | Final cuts, cleanup decisions, PySceneDetect execution. |
| `video_metadata_extraction_planning` | `pyav` | Plan fps, duration, stream, codec, frame-count, and checksum metadata. | Approved media refs, stream summaries, bounded time ranges. | Media metadata manifest, timecode/frame access policy. | `planning_ready_restricted` | FFprobe/PyAV execution, unbounded decode. |
| `image_resize_thumbnail_derivative_planning` | `sharp_libvips`, `opencv` metadata | Plan private thumbnails, review stills, OCR-prep stills, crops, and format policy. | Approved image/frame refs, checksum refs, derivative policy. | Private derivative manifest, thumbnail policy. | `planning_ready_restricted` | Derivative generation, public thumbnails, signed URL delivery. |
| `media_table_query_analysis_planning` | `duckdb`, `polars` | Plan safe metadata joins, route/cost summaries, row counts, and QA rollups. | Sanitized metadata tables, committed fixture data, route manifest refs. | Query summary manifest, DataFrame rollup, redaction status. | `planning_ready_restricted` | Supabase replacement, private row dumps, DuckDB/Polars runtime. |
| `media_pipeline_manifest_planning` | `track_b_route_capability_manifest_metadata` | Define Track B route eligibility, owner boundaries, blocked flags, and consumer handoff. | PR #298 reports, capability registry refs, approved snapshot refs. | Route/capability manifest, blocked-scope metadata. | `metadata_verified_by_PR350` | Route execution, worker execution, provider calls. |
| `cost_capacity_metadata_planning` | `track_b_cost_capacity_metadata` | Plan cost class, capacity risk, duration/frame assumptions, and bounded estimates. | Sanitized route metadata, cost policy refs. | Cost/capacity manifest, estimate assumptions. | `planning_ready_restricted` | Credit mutation, billing changes, provider spend. |
| `benchmark_sidecar_metadata_planning` | `track_b_benchmark_sidecar_metadata` | Record future benchmark, profiler, local sidecar, and no-op worker metadata. | Sanitized benchmark summaries, sidecar policy refs, no-op evidence refs. | Benchmark/sidecar metadata manifest, profiler policy. | `planning_ready_restricted` | Sidecar launch, host probing, Docker/Cloud Run, worker execution. |
| `sound_audio_handoff_planning` | Track B handoff metadata only | Hand off technical audio/noise/stretch observations to `SOUND_MUSIC_AUDIO`. | Audio segment refs, prior evidence refs, timing refs. | Audio handoff note, owner blocker. | `related_owner_pending` | DeepFilterNet runtime, Signalsmith Stretch runtime, Demucs runtime. |
| `creative_graphics_handoff_planning` | Track B handoff metadata only | Hand off safe-zone/OCR/frame constraints to `AI_TOOLS_CREATIVE_GRAPHICS`. | Frame analysis refs, OCR refs, derivative policy refs. | Graphics constraint handoff. | `related_owner_pending` | Creative image generation, graphics rendering, public artifacts. |
| `render_export_handoff_planning` | Track B handoff metadata only | Hand off media-analysis manifests to `TRACK_A_RENDER_EXPORT`. | Scene/shot refs, media metadata refs, derivative policy refs. | `track_b_media_analysis_intake`. | `related_owner_pending` | Final render, export, Track A runtime. |

## Required False Flags

- `routeExecutionAllowed: false`
- `runtimeExecutionAllowed: false`
- `workerExecutionAllowed: false`
- `providerExecutionAllowed: false`
- `toolExecutionAllowed: false`
- `mediaProcessingAllowed: false`
- `supabaseWritesAllowed: false`
- `dependencyMutationAllowed: false`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
