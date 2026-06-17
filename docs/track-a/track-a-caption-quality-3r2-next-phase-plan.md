# TRACKA-CAPTION-QUALITY-3R2 Next Phase Plan

Status: `blocked_pending_review_safe_visual_artifact`

## Readiness

TRACKA-CAPTION-QUALITY-4 readiness: `blocked_pending_review_safe_visual_artifact`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

## Next Prompt

`TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 — Resolve approved caption burn-in runtime path`

## Required Before TRACKA-CAPTION-QUALITY-4

- approved caption burn-in runtime path with FFmpeg/libass/FFprobe support.
- corrected-caption preview generated from #426 caption source and #452 approved source ref.
- FFprobe/QA metadata for the corrected-caption preview.
- uploadable review-safe visual artifact or direct representative frames/video.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation was allowed only with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true, using the approved #452 private source ref, and producing private review artifacts only.
