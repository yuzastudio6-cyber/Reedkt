# INTERNAL-BETA-TRACKA-SCOPE-DECISION-1

## Goal

Record the first restricted internal beta Track A scope decision after corrected-caption burn-in revalidation and missing visual evidence review have produced enough private review evidence.

## Required Sources

- #419 visual review outcome.
- #422 visual gap closure packet.
- #426 approved controlled-test caption source.
- #429 merged missing visual evidence bundle.
- #434 missing visual evidence review outcome.
- #440 caption burn-in revalidation planning.
- #443 guarded burn-in revalidation execution packet.
- #447 fail-closed corrected-caption execution attempt.
- #452 approved private source ref.
- #459 guarded corrected-caption burn-in revalidation with approved source result.
- TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1 runtime path status: `blocked_ffmpeg_missing_ass_subtitles_filter`.

## Required Decisions

- decide whether BiRefNet/text-behind-subject is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- decide whether Real-ESRGAN/enhancement is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- confirm OpenColorIO/OpenImageIO remains sample-level only unless stronger proof is supplied.
- confirm OTIO/full private E2E cannot be considered closed until corrected-caption burn-in revalidation and private E2E review evidence exist.

## Current Required Statuses

TRACKA-CAPTION-QUALITY-3R3 readiness: `blocked_ffmpeg_missing_ass_subtitles_filter`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

INTERNAL-BETA readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: `optional_scope_expansion_only`

## Blocked Claims

This prompt must not claim internal beta readiness, external beta readiness, production readiness, final delivery readiness, runtime readiness, public artifact readiness, or signed URL readiness.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level FFmpeg/FFprobe provisioning were allowed; no media input or output was used.
