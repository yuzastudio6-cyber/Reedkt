# Production Tool Cost Estimate And Event Adapter

RP-TOOLCOST-01 adds server-only mock-safe adapters around the hardened RP-RATECARD-01 cost math:

- `estimateProductionToolCost` returns low/expected/high internal cost ranges, pricing snapshots, prerequisite status, reservation-fit metadata, and warnings.
- `emitProductionToolCostEvent` records idempotent mock `MockToolCostEvent` records for actual internal tool cost only.
- Billable production events require approved plan context, approved credit estimate, active reservation when the profile requires it, and an idempotency key.
- Non-billable/system/internal-test events can be recorded as absorbed cost without user billing.

The adapter uses `ToolCreditPrerequisiteStatus` values: `ready`, `estimate_only`, `missing_approved_plan`, `missing_approved_credit_estimate`, `missing_active_credit_reservation`, `missing_idempotency_key`, `production_blocked`, `requires_revised_estimate`, and `invalid_context`.

RP-ESTIMATE-01 consumes `estimateProductionToolCost` outputs to build user-facing edit credit estimate previews. The preview can reuse missing-reservation statuses as future approval/reservation readiness metadata, but it still does not emit billable tool-cost events or mutate credits.

## Boundaries

The adapter rejects secret-like metadata and forbidden billing/provider fields such as provider headers, raw provider payloads, credentials, wallet IDs, ledger IDs, and user-supplied service-fee fields. Its pricing snapshots keep `serviceFeeIncluded = false`.

Existing mock-safe provider gateway, render service, and production worker placeholder paths may attach cost estimate/event metadata. They still do not call providers, execute render/export, run real workers, mutate wallets, mutate reservations, write ledgers, or execute settlement.

`smoke:production-tool-cost` covers estimate success/failure, event idempotency, billable vs non-billable aggregation, settlement-preview service fee separation, and mock boundary metadata. `smoke:credit-estimate` covers the estimate-preview bridge into `CreditEstimateRecord` and line items.
