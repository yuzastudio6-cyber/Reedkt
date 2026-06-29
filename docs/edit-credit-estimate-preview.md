# Edit Credit Estimate Preview

RP-ESTIMATE-01 adds a mock-safe edit-level-aware credit estimate preview before paid work starts. It builds a user-facing estimate from production tool estimates, product edit level, final duration, and RP-CREDITPOLICY-01 service-fee math.

## Source Of Truth

- Production tool costs come from `estimateProductionToolCost`.
- Product edit levels remain `normal`, `premium`, and `ultra_premium`.
- Tool/runtime compute levels remain `economy`, `standard`, and `premium`.
- ReEditPro service/edit fee is calculated separately by credit policy math.
- Existing `CreditEstimateRecord` and `CreditEstimateLineItemRecord` remain the estimate record surface.

Legacy `basic | pro | premium` and runtime `economy | standard | premium` are not accepted as product estimate levels.

## Preview Behavior

The preview returns low, expected, and high tool-cost estimates, then adds a separate ReEditPro service/edit fee estimate. The high total is the future required hold. If an available credit snapshot is supplied, the preview reports informational top-up credits; it does not start checkout, mutate credits, or unlock export.

Line items use one production tool line per planned tool plus one separate service-fee line. Tool lines keep `serviceFeeIncluded = false`; the service-fee line is labeled with `linePayload.lineItemRole = reeditpro_service_fee`.

## Store And Routes

The mock store supports insert, list, latest-by-edit-plan, and idempotent preview upsert. The mock-only routes are:

- `POST /v1/credit-estimates/preview`
- `GET /v1/projects/:projectId/credit-estimates`
- `GET /v1/edit-plans/:editPlanId/credit-estimates/latest`

The routes return warnings that no live persistence, wallet mutation, reservation spend/release/refund, ledger write, provider call, worker, render/export, Stripe checkout, Supabase write, or credit spend occurred.

## Lower-Cost Options

The preview deterministically suggests lower-cost options for product-level downgrade, premium/high-risk tool reduction, render-quality reduction, optional audio/SoundSync scope reduction, and custom estimate review when a duration requires owner review.

## Boundary

RP-ESTIMATE-01 does not approve estimates, reserve credits, spend credits, settle final charges, call providers, execute workers, render/export, create migrations, run Supabase, or change frontend UI. Future approval, reservation, top-up, and visible estimate card wiring remain separate milestones.

`smoke:credit-estimate` covers level validation, production tool estimate reuse, service-fee separation, line-item payloads, idempotency, latest lookup, top-up/custom behavior, lower-cost options, secret-like metadata rejection, settlement-preview separation, and no side effects.

## RP-RESERVATION-01 Handoff

RP-RESERVATION-01 consumes ready estimate previews and creates a mock max-hold reservation through `POST /v1/credit-estimates/:creditEstimateId/reservations/max`. The reservation holds `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`, and reuses high-credit estimate line payloads for reservation line items. It remains mock-only: no live billing, no Stripe, no Supabase, no provider, no production ledger write, no render/export, no checkout/top-up, and no settlement.
