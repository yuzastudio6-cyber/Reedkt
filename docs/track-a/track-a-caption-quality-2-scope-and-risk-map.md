# TRACKA-CAPTION-QUALITY-2 Scope And Risk Map

Status: `planning_only`

## First Internal Beta Scope Risks

| Risk | Source | Decision |
| --- | --- | --- |
| corrected caption burn-in not visually revalidated | #426 and #434 | cannot defer; internal beta remains blocked |
| OTIO/full private E2E proof still needs corrected-caption context | #422 and #434 | cannot defer |
| BiRefNet/text-behind-subject proof remains insufficient | #434 | exclude/defer feature for first restricted beta or run optional TRACKA-MISSING-VISUAL-EVIDENCE-3 |
| Real-ESRGAN/enhancement proof remains missing | #434 | exclude/defer feature for first restricted beta or run optional TRACKA-MISSING-VISUAL-EVIDENCE-3 |
| OpenColorIO/OpenImageIO proof is sample-level only | #434 | may remain provisional if pro color/image scope is excluded or restricted |

## Fastest Safe Path

1. TRACKA-CAPTION-QUALITY-3 burn-in revalidation execution packet.
2. INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 to define the first restricted beta feature scope.
3. TRACKA-PRIVATE-E2E-REVALIDATION-1 planning after corrected-caption burn-in and scope decision.
4. INTERNAL-BETA-READINESS-ROLLUP only after the prior blockers are closed.

## Scope Decisions Preserved From #434

- missing visual evidence: `partial_pass_with_warnings`
- full missing visual evidence closure: `false`
- full Track A visual closure: `false`
- internal beta readiness: `false`
- production readiness: `false`
- external beta readiness: `false`
- final delivery readiness: `false`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
