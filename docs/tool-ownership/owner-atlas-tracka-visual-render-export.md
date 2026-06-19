# Owner: Atlas Track A

ownerDisplayName: Atlas Track A

ownerId: owner_tracka_visual_render_export

workstream: TRACK_A_VISUAL_RENDER_EXPORT

ownerRole: Scoped owner for Track A visual/render/export policy, private review, and private E2E handoff responsibilities after TOOL-OWNER-CONFLICT-SCAN-1.

responsibilityType: tracka_scoped_visual_render_export_ownership

currentStatus: ownership_claim_scoped_pending_merge_order

humanOwnerPromptSource: current chat request

duplicateRisk: resolved_to_scoped_tracka_claims

nextRequiredAction: MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

lastUpdatedByBranch: codex/rp-tool-owner-registry-1-atlas-tracka-visual-render-export

## Conflict Scan Decision

TOOL-OWNER-CONFLICT-SCAN-1 decision: `completed_scoped_ownership_repair_clean`

Atlas Track A is no longer claiming broad/global tool ownership. It keeps only Track A-specific ownership and handoff-only integration responsibilities that do not duplicate Track B, AI Graphics, Worker Runtime, Supabase, or other owner scopes.

Unresolved conflicts: none

## Kept Atlas Track A Claims

| scopedClaimId | source candidate | classification | ownershipStatus | boundary |
| --- | --- | --- | --- | --- |
| tracka_caption_burnin_policy_e2e | tracka_caption_burnin | keep_owned_by_atlas_tracka | scoped_owned_by_atlas_tracka | Track A caption burn-in policy, source-of-truth, private E2E review handoff, and caption QA policy only. |
| tracka_render_export_private_review_path | tracka_render_export_hardening | keep_owned_by_atlas_tracka | scoped_owned_by_atlas_tracka | Track A private render/export review path, private manifest/checksum/QA policy, and blocked final delivery policy only. |
| tracka_visual_video_private_e2e | tracka_visual_video_private_e2e | keep_owned_by_atlas_tracka | scoped_owned_by_atlas_tracka | Restricted Track A visual-video private E2E review readiness path only. |

## Shared Dependencies / Handoff-Only Labels

| sourceTool | scopedClaimId | classification | existing owner evidence | Atlas Track A boundary |
| --- | --- | --- | --- | --- |
| ffmpeg | tracka_ffmpeg_render_export_handoff_only | shared_upstream_dependency_tracka_integration_only | PR #542 Track B Media OSS Steward | Render/export handoff policy only; no global FFmpeg ownership, install, probe, media-processing, or execution claim. |
| ffprobe | tracka_ffprobe_export_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | PR #542 Track B Media OSS Steward | Export validation handoff policy only; no global FFprobe ownership, file probing, media-processing, or execution claim. |
| libass | tracka_libass_caption_burnin_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A caption burn-in evidence and open conflict scan | Caption burn-in policy handoff only; no global libass ownership, install, media-processing, or execution claim. |
| remotion | tracka_remotion_render_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A render validation evidence and open conflict scan | Render validation handoff only; no global Remotion ownership, render/export execution, or runtime claim. |
| opentimelineio | tracka_opentimelineio_validation_handoff_only | shared_upstream_dependency_tracka_integration_only | Track A timeline validation evidence and open conflict scan | Timeline validation handoff only; no global OpenTimelineIO ownership, install, or execution claim. |

## Dropped From Atlas Global Ownership

| toolId | classification | leftTo |
| --- | --- | --- |
| ffmpeg | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| ffprobe | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| sharp_libvips | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| opencolorio | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| openimageio | owned_by_other_workstream_drop_from_atlas | PR #542 Track B Media OSS Steward |
| sam2 | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| kornia | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| birefnet | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| real_esrgan | owned_by_other_workstream_drop_from_atlas | PR #543 AI Graphics owner assignment |
| libass | shared_upstream_dependency_tracka_integration_only | Track A handoff-only label, no global owner claim |
| remotion | shared_upstream_dependency_tracka_integration_only | Track A handoff-only label, no global owner claim |
| opentimelineio | shared_upstream_dependency_tracka_integration_only | Track A handoff-only label, no global owner claim |
| film | unclear_pending_source_review | Deferred pending source review; no Atlas global claim |

## Conflict Evidence

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## Explicitly Not Owned

Track B media processing tools; global FFmpeg; global FFprobe; global Sharp/libvips; global OpenColorIO; global OpenImageIO; global SAM2; global Kornia; global BiRefNet; global Real-ESRGAN; FILM until source review; web search/capture tools; map/geospatial tools; AI creative graphics tools outside Track A handoff; sound/music/audio tools; provider/model execution; worker runtime infrastructure; Supabase schema/RLS/migrations; billing/Stripe/credits.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
