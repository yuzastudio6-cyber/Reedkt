# TRACKA-CAPTION-QUALITY-2 Burn-In Revalidation Planning

## Goal

Plan a future caption burn-in and Remotion preview revalidation phase using the approved controlled-test caption source from TRACKA-CAPTION-QUALITY-1.

## Required Source Evidence

- `docs/track-a/track-a-approved-caption-source.md`
- `docs/track-a/track-a-caption-text-qa-rules.md`
- `docs/track-a/track-a-caption-copy-review-report.md`
- `docs/track-a/track-a-caption-quality-revalidation-plan.md`
- #419 TRACKA-VISUAL-REVIEW-2C
- #422 TRACKA-VISUAL-GAP-CLOSURE-1
- #426 TRACKA-CAPTION-QUALITY-1
- #429 TRACKA-MISSING-VISUAL-EVIDENCE-1 open evidence at `ce872be9`
- TRACKA-MISSING-VISUAL-EVIDENCE-2 outcome, which records `technical_pass_with_caption_revalidation_warning` for the old libass and Remotion previews.

## Required Work

- consume `captionSourceType: controlled_test_caption_copy`.
- preserve `transcriptAccuracyClaim: false`.
- plan future visual burn-in revalidation only after exact review-safe private artifacts are available.
- define pass/fail criteria for caption visibility, line breaks, safe zones, grammar, timing compatibility, and visual collision.
- keep Track A runtime, Remotion, libass, FFmpeg, media processing, and render/export blocked unless a separate approved execution phase explicitly unlocks them.

## Acceptance Criteria

- visual burn-in revalidation plan references the approved caption source.
- caption text remains controlled-test-only.
- corrected #426 caption copy is the only approved controlled-test caption text for this revalidation path.
- old awkward caption text from the uploaded #429 preview samples is explicitly rejected and not reused.
- no transcript accuracy, internal beta, external beta, production, runtime, final delivery, public artifact, or signed URL approval is claimed.

## Current Readiness

TRACKA-CAPTION-QUALITY-2 readiness: ready_for_burnin_revalidation_planning

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_and_remaining_scope_decision

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
