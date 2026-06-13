# TRACK_A_RENDER_EXPORT Routing Policy

Status: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

This policy defines when the AI brain routes work to Track A for render/export planning. The route is planning-only until a later approved worker/runtime milestone enables execution.

## Route To Track A When

- The edit needs final composition planning from an approved plan snapshot.
- The user or workflow needs a private preview or review-only composition plan.
- A render manifest or export manifest must be assembled from structured timing, asset, caption, audio, map, web, or graphic manifests.
- Captions, subtitles, lower thirds, title cards, overlays, map visuals, web/source evidence visuals, or transparent graphics need safe-zone and layer composition review.
- AI Tools, MAP_GEOSPATIAL, WEB_SEARCH_CAPTURE, TRACK_B_MEDIA_PROCESSING, or SOUND_MUSIC_AUDIO produces a private manifest that must be composed into the future final canvas.
- Final artifact QA handoff must define checks before any future export or delivery claim.

## Do Not Route To Track A When

- The request is to generate creative assets. Route to `AI_TOOLS_CREATIVE_GRAPHICS` for planning.
- The request is to analyze or process raw source media. Route to `TRACK_B_MEDIA_PROCESSING`.
- The request is to search the web or capture a browser. Route to `WEB_SEARCH_CAPTURE`.
- The request is to create map data, geocode, route, fetch tiles, or render maps. Route to `MAP_GEOSPATIAL`.
- The request is to generate, mix, or process audio. Route to `SOUND_MUSIC_AUDIO`.
- The request is to call providers/models. Route to `PROVIDER_GATEWAY_MODELS` for proposal-only policy unless a later explicit execution phase exists.
- The request is to execute workers, claim jobs, run tools, or mutate runtime state. Route to `WORKER_RUNTIME_JOBS` for future runtime approval only.

## Execution Boundary

- Track A can plan future composition and export requirements.
- Track A cannot execute Remotion, FFmpeg, libass, OpenTimelineIO, browser/canvas rendering, render workers, export workers, storage writes, or delivery.
- Worker Runtime approval is required before any execution.
- Provider/DeepSeek outputs can propose specs or code only; they cannot execute Track A work.
- Raw prompts are never direct execution instructions.

## Source-Of-Truth Policy

- Source-of-truth inputs: approved snapshots, private manifests, checksums, source refs, timing refs, caption/subtitle refs, audio cue refs, map/style/camera refs, web/source evidence manifests, QA records, and owner handoff records.
- Not source-of-truth: screenshots, temporary renders, preview videos, public artifacts, signed URLs, raw prompts, raw provider responses, raw search responses, raw snippets, and generated media files without manifests/checksums.

## Runtime Readiness Policy

Track A remains blocked until all of these are separately approved:

- Worker Runtime execution route and transactional claim/lease policy.
- Render/export worker implementation and command boundary.
- Private storage/artifact checksum policy.
- Supabase/storage metadata policy.
- Billing/credit reservation policy.
- Observability, audit, cost, and abuse controls.
- Compliance/security review.
- Final QA and rollback policy.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
