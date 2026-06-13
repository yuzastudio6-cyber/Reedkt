# TRACK_B_MEDIA_PROCESSING Routing Policy

Status: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

This policy defines when the AI brain routes media-analysis planning to Track B. It does not authorize execution.

## Route To Track B When

- Uploaded/source media needs OCR/text-in-frame planning.
- Frames or stills need safe-zone, blur, crop, object-region, or derivative planning.
- Scene or shot boundaries need candidate planning.
- Media metadata, fps, duration, frame count, streams, codecs, or private derivative policy needs planning.
- Technical audio issues need a Sound/Music/Audio handoff for voice/noise cleanup planning.
- Timing/stretch constraints need a Track A or Sound handoff for future speed/time-stretch planning.
- Route eligibility, cost class, capability profiler, local sidecar, or private artifact policy needs Track B metadata.
- Future VLM or Demucs paths need blocker/evidence review without execution.

## Tool-Specific Routing

- Use OCR planning with `paddleocr` and `paddlepaddle` when visible text may affect captions, lower thirds, source labels, proof cards, screenshots, or safe zones.
- Use `opencv` planning for frame/image safe zones, blur/quality checks, contour/region hints, crop/framing QA, and derivative constraints.
- Use `pyav` planning for container/frame access policy, timecode/fps/duration metadata, and frame sampling constraints.
- Use `pyscenedetect` planning for scene and shot-boundary candidate manifests.
- Use `sharp_libvips` planning for thumbnails, image resize/crop, review stills, simple image derivatives, and alpha/format policy.
- Use `duckdb` for local/report metadata table analysis planning and route/cost summary planning.
- Use `polars` for DataFrame-style QA summaries, route rollups, and metadata transformations.
- Use `deepfilternet` only as a future voice/noise cleanup planning and evidence-intake path; runtime remains blocked.
- Use `signalsmith_stretch` when moderate speed/time-stretch or music duration fitting must be planned; runtime remains blocked.
- Use `demucs_blocked` only to record stem-separation blocker evidence until provenance/legal/runtime approval exists.
- Use `qwen3_vl_blocked` and `vllm_blocked` only to record future VLM/model-serving blockers until separately approved.

## Avoid Track B Processing When

- The work is final composition/render/export: request `TRACK_A_RENDER_EXPORT`.
- The work is creative graphics, cards, charts, animation, or stylized overlays: request `AI_TOOLS_CREATIVE_GRAPHICS`.
- The work is map/geospatial truth, camera, routing, or style: request `MAP_GEOSPATIAL`.
- The work is web search or browser capture: request `WEB_SEARCH_CAPTURE`.
- The work is creative music, SFX, cueing, or audio style: request `SOUND_MUSIC_AUDIO`.
- The work is provider/model execution: request `PROVIDER_GATEWAY_MODELS` review.
- The work is runtime/worker execution: request `WORKER_RUNTIME_JOBS` approval.

## Execution Boundary

- Media processing cannot run inside TOOL-STUDY-0.
- Broad media remains blocked because no owner-specific artifact scope, runtime sandbox, retention policy, or QA gate is approved here.
- Raw prompt execution is never a direct execution path; workers must execute approved snapshots and manifests.
- Private manifests and checksums are source-of-truth; public artifacts and signed URLs remain blocked.
- Qwen/VLM runtime and vLLM serving remain blocked unless separately approved.
- Demucs remains blocked pending provenance, legal, model-artifact, and runtime unlock review.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
