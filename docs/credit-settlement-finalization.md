# Credit Settlement Finalization

RP-SETTLEMENT-01 adds mock-safe final credit settlement for completed edits. It converts billable tool-cost events into the final user charge, adds the ReEditPro service/edit fee separately, spends only local mock reserved credits, and can release unused mock hold back to the mock wallet.

The settlement formula remains:

```text
actual_billable_tool_cost_credits
+ ReEditPro service/edit fee credits
= final user charge credits
```

Tool-cost events must keep `serviceFeeIncluded = false`. Non-billable provider, runtime, or ReEditPro failure costs are excluded from the user charge and shown only as absorbed internal cost in the receipt summary.

## Outcomes

- `settled`: final charge fits the reservation. The mock wallet reserved balance decreases, mock spent credits increase, unused reserved credits return to available credits, and the reservation status becomes `spent`.
- `settled_with_absorbed_overage`: computed final cost exceeds the approved hold without approved funding. User charge is capped at reserved credits and ReEditPro records the absorbed overage.
- `requires_top_up_before_export`: approved but unfunded final cost is recorded with outstanding credits. The mock wallet and reservation are not mutated, and export lock/top-up remains future work.

Reservation line items are settled with `lineItemSettlementAllocationMode = proportional_mock` when exact tool-to-line mapping is incomplete. Line-item spent and released totals must reconcile to the reservation totals.

## Boundaries

RP-SETTLEMENT-01 is local/mock only: no live billing, no Stripe/payment, no Supabase migration or write, no production wallet mutation, no production ledger write, no provider call, no worker execution, no render/export execution, no export lock/unlock, and no checkout/top-up. See `smoke:credit-settlement`.

RP-EXPORTLOCK-01 consumes this settlement state after completion. `settled` and `settled_with_absorbed_overage` are export-ready, while `requires_top_up_before_export` returns "Action required: add credits to export" and records only a local mock lock; there is still no checkout/top-up, render/export execution, production wallet mutation, production ledger write, Supabase write, or export unlock.

RP-CREDITPURCHASE-01 can fund the local mock wallet after an approved-but-unfunded settlement. The settlement record is not rerun or mutated by top-up; the user must recheck the export gate after credits are added.
