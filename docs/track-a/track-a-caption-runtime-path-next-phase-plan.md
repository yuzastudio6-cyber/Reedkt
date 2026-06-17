# Track A Caption Runtime Path Next Phase Plan

Status: `blocked_homebrew_ffmpeg_lacks_libass_filter_support`

## Readiness

TRACKA-CAPTION-QUALITY-3R3 readiness: `blocked_homebrew_ffmpeg_lacks_libass_filter_support`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Production/external beta/final delivery: `blocked`

## Next Prompt

`TRACKA-CAPTION-QUALITY-3R3 — Burn-in revalidation execution with approved runtime path`

## Human Action Required

Homebrew core ffmpeg still lacks libass-backed ass/subtitles filters after approved libass repair; obtain explicit approval for a different approved local FFmpeg build path before rerunning metadata checks.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level Homebrew FFmpeg/FFprobe/libass provisioning were allowed; no media input or output was used.
