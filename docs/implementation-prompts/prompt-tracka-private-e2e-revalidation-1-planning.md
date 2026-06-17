# TRACKA-PRIVATE-E2E-REVALIDATION-1 Planning

## Goal

Plan a future private Track A E2E revalidation packet after TRACKA-VISUAL-GAP-CLOSURE-1, TRACKA-CAPTION-QUALITY-1, TRACKA-MISSING-VISUAL-EVIDENCE-2, TRACKA-CAPTION-QUALITY-2, and TRACKA-CAPTION-QUALITY-3 have bounded the caption-quality, corrected-caption burn-in, and missing-evidence blockers from #419.

## Current Blocker

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_revalidation_execution_and_scope_decision`

#419 recorded `pass_with_warnings_sample_level` for uploaded samples and `fullTrackAVisualClosurePassed: false`.

#426 closed controlled-test caption text quality, but caption visual burn-in revalidation remains required.

TRACKA-MISSING-VISUAL-EVIDENCE-1 is merged as #429 at `e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f`, records the missing visual evidence bundle, and copied 5 visual artifacts without closing blockers by itself.

TRACKA-MISSING-VISUAL-EVIDENCE-2 records `overallDecision: partial_pass_with_warnings`, keeps `fullMissingVisualEvidenceClosurePassed: false`, and keeps `fullTrackAVisualClosurePassed: false`.

TRACKA-CAPTION-QUALITY-2 records corrected-caption burn-in revalidation planning, keeps corrected-caption visual burn-in unexecuted, and sets `TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet`.

TRACKA-CAPTION-QUALITY-3 records the guarded corrected-caption burn-in execution packet and defaults to `execution: blocked_pending_caption_burnin_execution_confirmation` until `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` is explicitly set.

## Required Precondition

Complete guarded caption burn-in revalidation execution and confirm the remaining first-internal-beta scope decision:

- use #426 approved controlled-test caption source.
- provide corrected-caption burn-in review evidence.
- provide one clean private E2E review clip or contact sheet.
- provide timeline consistency proof.
- provide final composition polish checklist.
- decide whether BiRefNet/text-behind-subject and Real-ESRGAN/enhancement are excluded from first restricted internal beta or need TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
 - keep internal beta blocked until corrected-caption burn-in execution and scope decision are recorded.

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

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
