# INTERNAL-BETA-TRACKA-SCOPE-DECISION-1

## Goal

Record the first restricted internal beta Track A scope decision after corrected-caption burn-in revalidation planning.

## Required Sources

- #419 visual review outcome.
- #422 visual gap closure packet.
- #426 approved controlled-test caption source.
- #429 merged missing visual evidence bundle.
- #434 missing visual evidence review outcome.
- TRACKA-CAPTION-QUALITY-2 burn-in revalidation planning packet.
- TRACKA-CAPTION-QUALITY-3 guarded burn-in revalidation execution packet.
- TRACKA-CAPTION-QUALITY-3R guarded corrected-caption burn-in execution result and, if available, TRACKA-CAPTION-QUALITY-4 visual outcome.
- #452 TRACKA-CAPTION-SOURCE-REF-1 approved private source ref.
- TRACKA-CAPTION-QUALITY-3R2 guarded corrected-caption burn-in revalidation with approved source result and, if available, TRACKA-CAPTION-QUALITY-4 visual outcome.

## Required Decisions

- decide whether BiRefNet/text-behind-subject is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- decide whether Real-ESRGAN/enhancement is excluded from first restricted internal beta or requires TRACKA-MISSING-VISUAL-EVIDENCE-3 first.
- confirm OpenColorIO/OpenImageIO remains sample-level only unless stronger proof is supplied.
- confirm OTIO/full private E2E cannot be considered closed until corrected-caption burn-in revalidation and private E2E review evidence exist.

## Current Required Statuses

TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet

TRACKA-CAPTION-QUALITY-3R readiness: ready_for_guarded_execution

TRACKA-CAPTION-QUALITY-3R2 readiness: blocked_pending_review_safe_visual_artifact unless a later guarded run creates a corrected-caption private visual preview

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_visual_review_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_visual_review_and_scope_decision

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: optional_scope_expansion_only

## Blocked Claims

This prompt must not claim internal beta readiness, external beta readiness, production readiness, final delivery readiness, runtime readiness, public artifact readiness, or signed URL readiness. It must preserve the TRACKA-CAPTION-QUALITY-3R2 execution status exactly, including any fail-closed blocker such as `blocked_missing_approved_caption_burnin_runtime_path`, unless a later guarded run creates and reviews a corrected-caption private visual artifact.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
