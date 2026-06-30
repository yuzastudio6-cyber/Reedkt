# RP-RUNTIME-GUARD-01 Runtime Credit Guard

RP-RUNTIME-GUARD-01 adds a mock-safe paid runtime guard before paid worker, provider, and render starts. It requires an approved plan, approved credit estimate, active credit reservation, idempotency key, production-ready tool profile, and a projected max charge that fits inside the approved reserved credits.

The guard reuses the credit foundation: max-estimate reservations, production tool-cost estimates/events, credit-policy service fee math, and `CreditRevisionActionRecord`. `reserved is the only active reservation status` for new paid work in this milestone; `partially_spent`, `expired`, `released`, `spent`, `refunded`, `cancelled`, `draft`, and `failed` are not active for starting more paid work.

If the next paid tool would exceed the approved max, the guard pauses before work starts and creates one idempotent revision action with `pauseReason = projected_overage` and the title `Action required: revised credit estimate needed`. The action includes approved max credits, used/committed credits, additional low/expected/high credits, new maximum estimate, and the options Approve & Continue, Choose Lower-Cost Option, and Cancel Extra Work.

Tool-cost events remain owner/internal-cost only with `serviceFeeIncluded = false`. Current billable tool credits come from billable mock tool-cost events for the same workspace/project/estimate/reservation; non-billable events remain visible but excluded. ReEditPro service fee is projected separately with credit-policy helpers.

Boundaries: no live billing, no Stripe/payment, no Supabase migrations or writes, no provider call, no worker run after a failed guard, no render/export execution, no production wallet mutation, no reservation spend/release/refund, no production ledger write, no settlement execution, no export unlock, and no checkout/top-up. `smoke:runtime-credit-guard` covers the guard contract and boundary integrations.
