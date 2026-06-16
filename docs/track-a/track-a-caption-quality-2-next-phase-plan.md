# TRACKA-CAPTION-QUALITY-2 Next Phase Plan

Status: `ready_for_next_planning_phase`

## Next Prompt

TRACKA-CAPTION-QUALITY-3 — Burn-in revalidation execution packet

## Required Next Inputs

- corrected caption source from #426
- sidecar planning contract from this packet
- future execution gates for libass, Remotion, FFmpeg/FFprobe, and private review artifacts
- confirmation that execution remains private, bounded, and owner-approved
- no internal beta, production, external beta, final delivery, public artifact, or signed URL approval

## Secondary Prompt

INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 should decide whether BiRefNet/text-behind-subject and Real-ESRGAN/enhancement are excluded from the first restricted internal beta.

## Readiness Carried Forward

TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: optional_scope_expansion_only

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
