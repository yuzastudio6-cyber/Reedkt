# TRACK_A_RENDER_EXPORT Tool Study

Owner: `TRACK_A_RENDER_EXPORT`

Status: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

This TOOL-STUDY-0 packet defines how the AI brain should route final composition, preview composition planning, render/export manifest planning, and review-only artifact handoffs to Track A. It is docs/diagnostics only. It does not execute renderers, exports, tools, workers, routes, providers, Supabase, Google Cloud, storage transfer, public delivery, or beta/production paths.

## Source Context

| Source | Status | Notes |
| --- | --- | --- |
| WEB_SEARCH_CAPTURE TOOL-STUDY-0 | merged | Provides sanitized source/capture/extraction manifests and QA reports for review-only visual evidence intake. |
| MAP_GEOSPATIAL TOOL-STUDY-0 | merged | Provides map style, camera, timing, GeoJSON, and render manifest planning inputs for future Track A overlays. |
| AI_TOOLS_CREATIVE_GRAPHICS TOOL-STUDY-0 | merged | Provides transparent overlay, card, data graphic, vector, animation, and scene manifests for Track A composition planning. |
| WORKER-1 approved-plan dry-run | read | Defines deterministic worker dry-run planning only; runtime execution remains blocked. |
| PLAN-SNAPSHOT-1 | read | Provides candidate-only plan snapshot evidence; runtime approval is false. |
| `server/activation/supabase-milestone-sync` | missing_on_base | No Supabase writer is added in this phase. |

## Owned Scope

- Final composition planning.
- Preview composition planning.
- Render and export manifest policy.
- Approved-plan render intake.
- Caption burn-in preview route ownership.
- Subtitle and caption composition handoff.
- Overlay composition handoff ownership.
- Lower-third and title-card composition handoff.
- Transparent overlay intake from AI Tools.
- Map overlay intake from MAP_GEOSPATIAL.
- Web/source evidence visual intake from WEB_SEARCH_CAPTURE.
- Media analysis intake from TRACK_B_MEDIA_PROCESSING.
- Sound and music cue intake from SOUND_MUSIC_AUDIO.
- Final artifact QA handoff.
- Private review artifact policy.
- Future export delivery policy.

## Explicitly Not Owned

- AI Tools creative asset generation.
- Remotion, D3, SVG, Satori, or graphics implementation.
- Track B media analysis/runtime.
- Raw media processing runtime.
- Worker Runtime execution.
- Provider/model calls.
- Supabase schema, RLS, migrations, or writes.
- Public artifact delivery unless a later policy approves it.
- Signed URL delivery unless a later policy approves it.
- Billing, credits, Stripe, or payment mutation.
- Production or external beta unlock.

## Routing Principle

Track A receives structured, private, approved-plan-derived manifests and turns them into future composition and export requirements. Track A does not execute in TOOL-STUDY-0. A later approved Worker Runtime and render/export milestone must convert those requirements into execution.

## Source-Of-Truth Principle

Structured private manifests, checksums, provenance records, timing records, media refs, overlay refs, caption/subtitle refs, render settings, export settings, and QA records are source-of-truth. Preview screenshots, temporary renders, public artifacts, raw prompts, raw provider responses, signed URLs, and provider/model output text are not source-of-truth.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
