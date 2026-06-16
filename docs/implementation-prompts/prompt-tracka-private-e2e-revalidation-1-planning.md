# TRACKA-PRIVATE-E2E-REVALIDATION-1 Planning

## Goal

Plan a future private Track A E2E revalidation packet after TRACKA-VISUAL-GAP-CLOSURE-1, TRACKA-CAPTION-QUALITY-1, and TRACKA-MISSING-VISUAL-EVIDENCE-2 have bounded the caption-quality and missing-evidence blockers from #419.

## Current Blocker

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_revalidation_and_remaining_scope_decision`

#419 recorded `pass_with_warnings_sample_level`, `visualReviewPassedForUploadedSamples: true`, and `fullTrackAVisualClosurePassed: false`.

TRACKA-MISSING-VISUAL-EVIDENCE-2 records `overallDecision: partial_pass_with_warnings`, keeps `fullMissingVisualEvidenceClosurePassed: false`, and keeps `fullTrackAVisualClosurePassed: false`.

## Required Precondition

Complete caption burn-in revalidation and confirm the remaining first-internal-beta scope decision:

- use #426 approved controlled-test caption source.
- provide corrected-caption burn-in review evidence.
- provide one clean private E2E review clip or contact sheet.
- provide timeline consistency proof.
- provide final composition polish checklist.
- decide whether BiRefNet/text-behind-subject and Real-ESRGAN/enhancement are excluded from first restricted internal beta or need TRACKA-MISSING-VISUAL-EVIDENCE-3 first.

## Allowed Future Scope

- define a private revalidation checklist.
- define required representative visual artifacts.
- define QA criteria and owner approvals.
- record whether private E2E can proceed after gap closure.

## Blocked Scope

- no Track A runtime execution.
- no FFmpeg/FFprobe, Remotion, libass, OTIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, or FILM execution.
- no media processing, frame extraction, or contact sheet generation.
- no GCS upload or signed URL creation.
- no Supabase mutation or SQL.
- no beta, production, final delivery, or broad media unlock.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
