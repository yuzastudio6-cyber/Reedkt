# TRACKA-MISSING-VISUAL-EVIDENCE-2 Scope Decision

Status: `scope_decision_recorded`

## Fastest Restricted Internal Beta Recommendation

For fastest restricted internal beta:

- Do not block first internal beta on Real-ESRGAN if enhancement is excluded from beta scope.
- Do not block first internal beta on BiRefNet if text-behind-subject/masking is excluded from beta scope.
- Do block first internal beta on corrected-caption burn-in revalidation and one clean private E2E review sample.
- Keep Real-ESRGAN and BiRefNet as scoped blockers for later internal-beta expansion unless those features are included in first beta.

## Scope Table

| Capability | First restricted internal beta default | Current status | Decision |
| --- | --- | --- | --- |
| caption visual burn-in | in scope | `blocked_pending_caption_burnin_revalidation` | cannot defer |
| OTIO/full private E2E | in scope | `technical_pass_with_caption_revalidation_warning` | cannot defer |
| `birefnet_stronger_visual_proof` | exclude unless masking/text-behind-subject is included | `blocked_insufficient_visual_evidence` | deferrable only if feature excluded |
| `real_esrgan_before_after_proof` | exclude unless enhancement is included | `blocked_missing_visual_evidence` | deferrable only if feature excluded |
| `opencolorio_openimageio_stronger_proof` | optional scoped sample-level support | `provisional_pass_sample_level` | acceptable sample-level evidence for restricted beta if stronger proof is deferred by owner |

## Readiness Impact

TRACKA-CAPTION-QUALITY-2 readiness: ready_for_burnin_revalidation_planning

TRACKA-MISSING-VISUAL-EVIDENCE-1 readiness: merged_source_evidence

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: ready_only_if_owner_wants_to_pursue_BiRefNet_or_Real_ESRGAN_before_internal_beta

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_and_remaining_scope_decision

Internal beta readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
