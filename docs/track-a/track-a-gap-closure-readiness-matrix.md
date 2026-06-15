# Track A Gap Closure Readiness Matrix

Status: `readiness_matrix_recorded`

## Readiness Matrix

| Work item | Readiness | Reason |
| --- | --- | --- |
| TRACKA-CAPTION-QUALITY-1 | `ready` | #419 identified a caption quality blocker with enough context to request approved caption source and caption QA. |
| TRACKA-MISSING-VISUAL-EVIDENCE-1 | `ready` | #419 identified exact missing/partial visual proof categories. |
| TRACKA-PRIVATE-E2E-REVALIDATION-1 | `blocked_pending_gap_closure` | Private E2E revalidation needs caption and missing-evidence closure first. |
| INTERNAL-BETA-READINESS-ROLLUP | `blocked_pending_tracka_gap_closure` | Caption quality and OTIO/full private E2E proof cannot defer. |
| TRACKA-OLDSTACK-CLOSURE-1 | `blocked_pending_gap_closure` | Historical PR closure should wait until Track A visual gaps are bounded. |

## Beta-Scope Decision Table

| Capability | in_scope_for_first_internal_beta | Required before first internal beta | Can defer to later internal beta | Can defer to external beta | Cannot defer |
| --- | --- | --- | --- | --- | --- |
| caption quality | yes | approved caption source and caption QA | no | no | yes |
| OTIO/full private E2E proof | yes | timeline consistency proof and full private E2E review artifact | no | no | yes |
| BiRefNet masking | proposed | required if text-behind-subject/masking is included | yes only if feature excluded | yes only if feature excluded | conditional |
| Real-ESRGAN enhancement | proposed optional | required if enhancement is included | yes if feature excluded | yes if feature excluded | conditional |
| OpenColorIO/OpenImageIO pro color/image | proposed optional | required if pro color/image is included | yes if feature excluded | yes if feature excluded | conditional |

## Recommended Fastest Safe Path

1. TRACKA-CAPTION-QUALITY-1
2. TRACKA-MISSING-VISUAL-EVIDENCE-1 scoped to OTIO/full E2E plus BiRefNet if needed
3. TRACKA-PRIVATE-E2E-REVALIDATION-1 planning
4. INTERNAL-BETA-READINESS-ROLLUP

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
