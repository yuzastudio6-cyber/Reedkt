# TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1

Installed/planned/blocked status for Atlas Track A scoped claims only.

## Goal

After TOOL-OWNER-REGISTRY-1 / PR #544 is merged, inventory only the scoped Atlas Track A claims and their handoff-only dependencies. Do not reintroduce broad/global ownership claims that were dropped by TOOL-OWNER-CONFLICT-SCAN-1.

## Scoped Atlas Track A Claims

- tracka_caption_burnin_policy_e2e
- tracka_render_export_private_review_path
- tracka_visual_video_private_e2e

## Handoff-Only Dependencies

- tracka_ffmpeg_render_export_handoff_only
- tracka_ffprobe_export_validation_handoff_only
- tracka_libass_caption_burnin_handoff_only
- tracka_remotion_render_validation_handoff_only
- tracka_opentimelineio_validation_handoff_only

## Not Atlas Track A Global Ownership

Do not inventory these as Atlas-owned global tools:

- ffmpeg
- ffprobe
- libass
- remotion
- opentimelineio
- sharp_libvips
- opencolorio
- openimageio
- sam2
- kornia
- birefnet
- real_esrgan
- film

## Blocked Scope

This inventory must not install tools, execute tools, process media, mutate dependencies, change package-lock, run workers/routes/providers/models, mutate Supabase, run SQL, or unlock internal beta, external beta, production, final render/export, public artifacts, or signed URLs.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
