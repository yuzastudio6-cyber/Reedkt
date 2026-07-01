# RP-RESERVATION-01 Max Estimate Credit Reservation

RP-RESERVATION-01 adds the mock-safe reservation step after an approved credit estimate and before paid work may start. The hold amount is `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`; in plain audit language, this means maximum hold, not totalEstimatedCredits. For a low / expected / high estimate of 100 / 140 / 200 credits, the mock wallet must have 200 available credits and the reservation holds 200.

The reservation route is local in-memory only:

- `POST /v1/credit-estimates/:creditEstimateId/reservations/max`
- `GET /v1/projects/:projectId/credit-reservations`
- `GET /v1/credit-estimates/:creditEstimateId/credit-reservations`

The route reuses the RP-ESTIMATE-01 preview store and blocks instead of falling back when max-hold data is missing, expired, not approved, custom-estimate-only, not ready for reservation, insufficiently funded, or idempotently already reserved. Reservation line items use high-credit line payloads where available and reconcile to `requiredHoldCredits`.

Allowed mock side effect: local in-memory wallet available credits move to reserved credits, and local in-memory reservation records are created. Boundaries remain explicit: no live billing, no Stripe/payment, no Supabase migration/write, no provider call, no production wallet mutation, no production ledger write, no settlement, no reservation spend/release/refund, no render/export, no export unlock, and no checkout/top-up.

Validation: `smoke:credit-reservation` covers max-hold reservation, insufficient-credit no-mutation behavior, idempotency, blocked estimate states, secret-like metadata rejection, line-item allocation, and legacy mock helper alignment.

RP-RUNTIME-GUARD-01 consumes this max-hold reservation at paid runtime boundaries. For new paid work, `reserved` is the only active reservation status; `partially_spent`, expired, missing, or mismatched reservations block without mutation. If the next high-cost projection exceeds the hold, the guard pauses with "Action required: revised credit estimate needed" and creates only a mock `projected_overage` revision action. Tool-cost events stay `serviceFeeIncluded = false`; no live billing, no provider, no render/export, no settlement, and no reservation spend/release/refund are wired.

RP-CREDITREVISION-01 may increase an existing `reserved` mock reservation only when the user chooses Approve & Continue for a projected-overage action and enough mock credits are available. The added reservation line is marked `revised_credit_additional_hold`; lower-cost and cancel resolutions leave reservation totals unchanged. See `docs/credit-revision-action-resolution.md` and `smoke:credit-revision-action`.

RP-SETTLEMENT-01 is the first mock-safe terminal consumer of this hold. It settles completed edits by spending only local mock reserved credits, returning unused hold to the mock wallet, and marking the reservation `spent`; approved-but-unfunded top-up remains informational and does not unlock export.
