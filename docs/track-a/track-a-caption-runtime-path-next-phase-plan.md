# Track A Caption Runtime Path Next Phase Plan

Status: `blocked_missing_local_ffmpeg_libass_runtime`

## Readiness

TRACKA-CAPTION-QUALITY-3R3 readiness: `blocked_missing_runtime_path`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Production/external beta/final delivery: `blocked`

## Next Prompt

`TRACKA-CAPTION-QUALITY-3R3 — Burn-in revalidation execution with approved runtime path`

## Human Action Required

install or expose an approved local FFmpeg/FFprobe build with ASS/subtitles filter support, then rerun the metadata-only runtime path check.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.
