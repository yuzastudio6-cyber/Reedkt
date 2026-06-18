# Track A Restricted Beta Risk Map

## Risk Register

| Risk | Status | Mitigation |
| --- | --- | --- |
| Caption layout variability | `mitigated_for_restricted_internal_beta_planning` | #492 configurable caption policy with default `one_line_bottom_safe_area` |
| Caption final delivery quality | `blocked` | final delivery remains outside this decision |
| Arbitrary user media | `blocked` | private E2E revalidation must stay in included controlled/private scope |
| BiRefNet/text-behind-subject evidence gap | `excluded` | re-enter only through `TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1` |
| Real-ESRGAN enhancement proof gap | `excluded` | re-enter only through `TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1` |
| OpenColorIO/OpenImageIO production color proof | `deferred` | sample-level proof is not enough for production color management |
| Public artifact exposure | `blocked` | no public artifacts or public delivery |
| Signed URL source-of-truth | `blocked` | signed URLs cannot become review source-of-truth |
| Worker/runtime readiness | `handoff_required` | private E2E planning must coordinate with WORKER_RUNTIME_JOBS without execution in this phase |
| Compliance/privacy | `handoff_required` | private-only artifacts, no broad media, no public delivery |
| Observability/cost | `handoff_required` | private E2E planning must record cost and observability notes |
| Supabase mutation risk | `none_in_this_phase` | docs/status only; no SQL, migration, schema, RLS, or storage mutation |

## Internal Beta Boundary

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_tracka_private_e2e_revalidation`

trackAInternalBetaUnlocked: false

productionReady: false

externalBetaReady: false

finalDeliveryReady: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
