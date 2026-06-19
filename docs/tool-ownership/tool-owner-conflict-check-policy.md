# Tool Owner Conflict Check Policy

Status: `completed_for_pr_544_expanded_scoped_claims`

## Policy Result

TOOL-OWNER-CONFLICT-SCAN-1 completed the Atlas Track A follow-up conflict repair for PR #544.

Atlas Track A must not claim raw global OSS tools already assigned to another owner. Atlas Track A may keep only scoped Track A Render/Export responsibility labels, and those labels do not permit installation, execution, media processing, worker runtime, final delivery, beta, or production unlock.

Product-ready end-to-end local OSS tools remain `0`.

## Current PR #544 Decision

TOOL-OWNER-CONFLICT-SCAN-1 decision: completed_expanded_scoped_ownership_repair_clean

currentStatus: ownership_claim_scoped_pending_merge_order

Unresolved conflicts: none

## Required Claimed Scoped Tools

- remotion_render_validation
- opentimelineio_timeline_validation
- hyperframe_render_handoff
- libass_caption_burnin
- gstreamer_render_pipeline_support
- bento4_mp4box_packaging_validation
- mkvtoolnix_container_validation
- vapoursynth_frame_pipeline
- revideo_render_preview_alternative
- film_frame_interpolation
- tracka_caption_burnin_policy_e2e
- tracka_render_export_private_review_path
- tracka_visual_video_private_e2e

## Shared Dependencies Owned Elsewhere

- ffmpeg
- ffprobe
- sharp_libvips
- opencolorio
- openimageio
- sam2
- kornia
- birefnet
- real_esrgan

## Dropped Claims

- dropped_to_track_b_owner: ffmpeg, ffprobe, sharp_libvips, opencolorio, openimageio
- dropped_to_ai_graphics_worker_owner: sam2, kornia, birefnet, real_esrgan
- dropped_or_not_claimed_due_other_lanes: Track B media processing tools, AI creative graphics tools, Sound/Music/Audio tools, Web Search/Capture tools, Map/Geospatial tools, Provider/API tools, Worker Runtime infrastructure, Supabase schema/RLS/migrations, Billing/Stripe/credits

## Evidence Sources

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## Future Owner Process

Before Atlas Track A installs, modifies, executes, or expands a scoped claim, it must:

1. read `docs/tool-ownership/central-tool-owner-registry.json`
2. read active owner sources under `docs/open-source-tool-stack/owner-registry/` and `docs/open-source-tool-stack/ownership/`
3. confirm the scoped claim does not duplicate an exact owner scope
4. coordinate with the owning lane for raw dependencies owned elsewhere
5. keep tool installation, execution, media processing, Supabase, SQL, dependencies, final delivery, beta, and production blocked unless a later approved packet explicitly unlocks that scope

## Next Prompt

MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
