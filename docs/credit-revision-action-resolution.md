# RP-CREDITREVISION-01 Revised Credit Action Resolution

RP-CREDITREVISION-01 resolves mock `projected_overage` pauses created by the runtime credit guard. It adds the user-action layer for Approve & Continue, Choose Lower-Cost Option, and Cancel Extra Work. It remains server/mock-only; no UI is added.

## Resolution Behavior

Approve & Continue resolves an `action_required` revision action as `approved`, calculates `additionalHoldCredits = max(0, newMaximumEstimatedCredits - reservation.reservedCredits)`, and increases only local in-memory mock wallet/reservation state when enough credits are available. The additional reservation line uses `linePayload.lineItemRole = revised_credit_additional_hold`; paid work does not start from this route and must pass a later runtime guard recheck.

Choose Lower-Cost Option resolves the action as `lower_cost_selected`, records the selected option, returns that a new lower-cost estimate or plan is required, and does not reserve credits or start paid work.

Cancel Extra Work resolves the action as `cancelled`, records cancellation metadata, leaves the reservation unchanged, and does not spend, release, refund, settle, or resume the original paid tool.

## Routes

- `POST /v1/credit-revision-actions/:creditRevisionActionId/approve-and-continue`
- `POST /v1/credit-revision-actions/:creditRevisionActionId/choose-lower-cost-option`
- `POST /v1/credit-revision-actions/:creditRevisionActionId/cancel-extra-work`

Each route requires workspace/project scope and an idempotency key. Secret-like metadata is rejected. Replaying the same resolution idempotency key returns the existing resolved action without duplicate additional hold.

## Runtime Guard Handoff

The runtime guard still controls continuation. An approved action plus an increased reservation can pass only when a later `evaluatePaidToolRuntimeGuard` call fits inside the revised max hold. A lower-cost or cancelled action blocks the original runtime idempotency path so the original paid tool does not silently resume.

Tool-cost events remain `serviceFeeIncluded = false`; ReEditPro service fee stays separate in credit-policy math.

## Boundaries

No live billing, no Stripe/payment, no Supabase migrations or writes, no provider call, no production wallet mutation, no production ledger write, no settlement execution, no reservation spend/release/refund, no worker/provider/render/export execution, no export lock/unlock, and no checkout/top-up are wired.

Validation: `smoke:credit-revision-action` covers approval with additional hold, insufficient-credit no-mutation behavior, idempotency, lower-cost/cancel resolution, invalid states, secret-like metadata rejection, runtime guard recheck, and boundary language.

RP-SETTLEMENT-01 consumes the resulting approved hold only after completed work. It may settle with unused-hold release or absorbed overage in local mock state, while lower-cost/cancelled revision actions still require a future plan path before any final settlement.
