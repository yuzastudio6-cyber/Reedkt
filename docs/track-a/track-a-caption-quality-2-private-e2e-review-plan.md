# TRACKA-CAPTION-QUALITY-2 Private E2E Review Planning

Status: `planning_only_blocked`

## Purpose

Define how corrected-caption burn-in evidence must feed a future private Track A E2E revalidation packet. This packet does not perform private E2E execution.

## Required Future Inputs

- corrected controlled-test caption source from #426
- future burn-in revalidation result from TRACKA-CAPTION-QUALITY-3
- #434 missing-evidence review outcome, preserving `partial_pass_with_warnings`
- first internal beta scope decision for BiRefNet/text-behind-subject and Real-ESRGAN/enhancement
- private review-safe clip or contact sheet proving the full E2E path
- manifest/checksum/provenance record

## Current Source Constraints

- BiRefNet remains `blocked_insufficient_visual_evidence` unless excluded from first restricted internal beta.
- Real-ESRGAN remains `blocked_missing_visual_evidence` unless excluded from first restricted internal beta.
- OpenColorIO/OpenImageIO remain `provisional_pass_sample_level`.
- OTIO/full private E2E remains `technical_pass_with_caption_revalidation_warning`.
- caption visual burn-in revalidation remains `blocked_pending_caption_burnin_revalidation`.

## Readiness

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

## Future Private E2E QA Gates

- corrected captions visible and readable.
- no old awkward captions.
- private E2E sample shows coherent composition.
- timeline consistency is reviewed.
- caption proof, missing-evidence proof, and scope decision are recorded before internal beta rollup.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
