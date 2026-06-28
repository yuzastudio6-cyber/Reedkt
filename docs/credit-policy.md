# Credit Policy

RP-CREDITPOLICY-01 locks the external-beta ReEditPro credit policy as policy/types/docs/constants only. It has no live billing, no Stripe, no Supabase migration, no wallet mutation, no provider call, no render/export charging, and no production settlement.

RP-CREDITDATA-01 builds on this policy with mock-safe `CreditSettlementRecord`, `CreditRevisionActionRecord`, `EditCreditCostSummary`, and read-only settlement preview data. The data foundation reuses the policy math and copy below; it does not add live billing, Stripe, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, provider calls, render/export execution, or export unlock behavior.

RP-RATECARD-01 hardens the mock-safe rate card and tool-cost math that feeds settlement preview. Tool-cost events still represent actual internal tool cost only, pricing snapshots keep `serviceFeeIncluded = false`, and the ReEditPro service fee remains a separate credit-policy/settlement-preview line. See `docs/rate-card-cost-math.md` and `smoke:rate-card`.

RP-TOOLCOST-01 derives cost-owner coverage for all 49 production registry tools and adds mock-safe estimate/event adapters. Billable production tool events require approved plan, approved estimate, reservation when required, and idempotency; the ReEditPro service fee still remains outside tool-cost events. See `docs/production-tool-cost-owner-coverage.md` and `smoke:production-tool-cost`.

RP-ESTIMATE-01 uses those production tool estimates to build mock-safe user-facing credit estimate previews. It adds ReEditPro service/edit fee as a separate line, reports the high estimate as the future required hold, and remains output-only: no approval, reservation, wallet mutation, ledger write, provider call, worker, render/export, checkout, or export unlock occurs. See `docs/edit-credit-estimate-preview.md` and `smoke:credit-estimate`.

## Credit Value

- 1 credit = $0.10 retail value.
- 10 credits = $1.00.
- 100 credits = $10.00.
- `CREDIT_RETAIL_VALUE_CENTS = 10`.
- `CREDITS_PER_DOLLAR = 10`.

Subscriptions are software access. Reedit Credits pay for AI generation, rendering, editing usage, and ReEditPro's service/edit fee. Subscriptions must never be described as unlimited AI editing.

Legacy documentation that said `100 credits = $5` is superseded by RP-CREDITPOLICY-01. The current external-beta policy is `100 credits = $10`.

## Final Charge

Final user charge:

```text
final_charge_credits =
  actual_billable_tool_cost_credits
  + reeditpro_service_fee_credits
```

Plain-language UI copy may say: final charge = actual tool cost + ReEditPro service fee. The service fee does not replace actual tool/edit cost.

Tool owners report actual internal tool cost only. Tool owners must never include the ReEditPro service/edit fee inside tool cost events. The mock-safe rate card keeps `serviceFeeIncluded = false`.

Credit conversion:

```text
actual_tool_cost_credits = ceil(actual_tool_cost_cents / 10)
```

All billing-critical outputs are integer credits.

## Reservation And Overage

Before paid work starts, ReEditPro shows a low / expected / high estimate. The user must approve the estimate and must have the high/max estimate available. ReEditPro reserves `maximumEstimatedCredits`, not expected credits.

Paid generation, rendering, and editing cannot start without an approved estimate and active reservation.

When projected cost may exceed the approved max, paid work must pause and create:

```text
Action required: revised credit estimate needed
```

Explanation:

```text
This edit is paused because it may exceed the credit amount you approved.
No extra paid work will continue until you approve the revised estimate or choose a lower-cost option.
```

Options:

- Approve & Continue
- Choose Lower-Cost Option
- Cancel Extra Work

If ReEditPro fails to pause and an unapproved overage happens, ReEditPro absorbs the overage. Do not silently take credits from the user's next edit. Do not create hidden negative wallet behavior.

Export lock copy:

```text
Action required: add credits to export
```

Use export lock only when the user approved the additional cost, the edit is ready, and the approved final charge is not fully funded. Do not use export lock when ReEditPro estimated incorrectly, provider variance occurred without user approval, or ReEditPro failed to pause in time.
