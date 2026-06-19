# TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1

Installed/planned/blocked status for Atlas Track A scoped claims only.

## Goal

After TOOL-OWNER-REGISTRY-1 / PR #544 is merged, inventory only Atlas Track A claimed scoped tools and the blocked status of their external dependencies. Do not reintroduce broad/global ownership claims dropped by TOOL-OWNER-CONFLICT-SCAN-1.

## Claimed Scoped Tools

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

These are not Atlas Track A global ownership claims:

- ffmpeg
- ffprobe
- sharp_libvips
- opencolorio
- openimageio
- sam2
- kornia
- birefnet
- real_esrgan

## Not Atlas Track A Ownership

Do not inventory these as Atlas-owned global tools:

- Track B media processing tools
- AI creative graphics tools
- Sound/Music/Audio tools
- Web Search/Capture tools
- Map/Geospatial tools
- Provider/API tools
- Worker Runtime infrastructure
- Supabase schema/RLS/migrations
- Billing/Stripe/credits

Product-ready end-to-end local OSS tools remain `0` until later install/proof milestones pass.

## Blocked Scope

This inventory must not install tools, execute tools, process media, mutate dependencies, change package-lock, run workers/routes/providers/models, mutate Supabase, run SQL, or unlock internal beta, external beta, production, final render/export, public artifacts, or signed URLs.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
