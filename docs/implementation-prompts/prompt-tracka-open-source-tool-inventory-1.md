# TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1

Installed/planned/blocked status for Atlas Track A tools.

## Goal

After TOOL-OWNER-CONFLICT-SCAN-1 completes, inventory the install, implementation, license/model-weight, execution-boundary, and beta/production readiness status for Atlas Track A claimed tools.

## Claimed Tool Scope

ffmpeg, ffprobe, libass, remotion, opentimelineio, sharp_libvips, opencolorio, openimageio, sam2, kornia, birefnet, real_esrgan, film, tracka_caption_burnin, tracka_render_export_hardening, tracka_visual_video_private_e2e.

## Blocked Until Conflict Scan

This inventory must not install tools, execute tools, process media, mutate dependencies, change package-lock, run workers/routes/providers/models, mutate Supabase, run SQL, or unlock internal beta, external beta, production, final render/export, public artifacts, or signed URLs.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
