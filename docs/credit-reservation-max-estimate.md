# RP-RESERVATION-01 Max Estimate Credit Reservation

RP-RESERVATION-01 adds the mock-safe reservation step after an approved credit estimate and before paid work may start. The hold amount is `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`; in plain audit language, this means maximum hold, not totalEstimatedCredits. For a low / expected / high estimate of 100 / 140 / 200 credits, the mock wallet must have 200 available credits and the reservation holds 200.

The reservation route is local in-memory only:

- `POST /v1/credit-estimates/:creditEstimateId/reservations/max`
- `GET /v1/projects/:projectId/credit-reservations`
- `GET /v1/credit-estimates/:creditEstimateId/credit-reservations`

The route reuses the RP-ESTIMATE-01 preview store and blocks instead of falling back when max-hold data is missing, expired, not approved, custom-estimate-only, not ready for reservation, insufficiently funded, or idempotently already reserved. Reservation line items use high-credit line payloads where available and reconcile to `requiredHoldCredits`.

Allowed mock side effect: local in-memory wallet available credits move to reserved credits, and local in-memory reservation records are created. Boundaries remain explicit: no live billing, no Stripe/payment, no Supabase migration/write, no provider call, no production wallet mutation, no production ledger write, no settlement, no reservation spend/release/refund, no render/export, no export unlock, and no checkout/top-up.

Validation: `smoke:credit-reservation` covers max-hold reservation, insufficient-credit no-mutation behavior, idempotency, blocked estimate states, secret-like metadata rejection, line-item allocation, and legacy mock helper alignment.
