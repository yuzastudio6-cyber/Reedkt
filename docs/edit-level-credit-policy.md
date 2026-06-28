# Edit Level Credit Policy

RP-CREDITPOLICY-01 defines product edit-level billing policy for `normal`, `premium`, and `ultra_premium`. This is not a runtime migration for the existing `basic | pro | premium` edit planner type, and it is not the same concept as tool/runtime compute levels such as `economy | standard | premium`.

RP-RATECARD-01 keeps that separation in the mock-safe rate card: tool runtime compute levels affect actual internal tool cost estimates/events, while product edit levels choose the ReEditPro service fee in settlement preview. Tool-cost pricing snapshots keep `serviceFeeIncluded = false`; no live billing, provider call, wallet mutation, reservation spend/release/refund, ledger write, render/export execution, or export unlock is added.

RP-TOOLCOST-01 keeps the same separation while deriving coverage for all 49 production registry tools. `normal | premium | ultra_premium` remain product edit levels; `economy | standard | premium` remain tool/runtime compute levels.

RP-ESTIMATE-01 builds mock-safe edit estimate previews on that separation. Product edit level chooses service-fee policy; tool/runtime compute level stays inside production tool cost snapshots. The preview may show a future required hold and top-up summary, but it does not reserve credits, mutate wallets, write ledgers, call providers, run workers, render/export, or unlock export.

## Service Fee

The ReEditPro service/edit fee is added on top of actual billable tool cost:

```text
service_fee_credits =
  max(length_floor_fee_credits, percentage_fee_credits)
```

Final charge = actual tool cost + ReEditPro service fee. The service fee does not replace actual tool/edit cost.

Length floor table:

| Duration | Normal | Premium | Ultra Premium |
| --- | ---: | ---: | ---: |
| 0-5 min | 30 | 50 | 80 |
| 5-10 min | 40 | 70 | 120 |
| 10-20 min | 70 | 120 | 200 |
| 20-60 min | 120 | 220 | 350 |
| 60+ min | custom estimate required | custom estimate required | custom estimate required |

Percentage protection:

| Product edit level | Percentage of actual billable tool cost credits |
| --- | ---: |
| normal | 10% |
| premium | 20% |
| ultra_premium | 30% |

Duration boundaries:

- `0 <= seconds <= 300`: 0-5 min.
- `300 < seconds <= 600`: 5-10 min.
- `600 < seconds <= 1200`: 10-20 min.
- `1200 < seconds < 3600`: 20-60 min.
- `seconds >= 3600`: custom estimate required.

Exact `10:00` stays in the 5-10 min bucket. Exact `60:00` requires a custom estimate.

## Examples

Normal 10-minute edit:

```text
actual tool cost = 120 credits
length floor = 40 credits
10% fee = 12 credits
service fee = max(40, 12) = 40 credits
final charge = 160 credits
```

Premium 10-minute edit:

```text
actual tool cost = 260 credits
length floor = 70 credits
20% fee = 52 credits
service fee = max(70, 52) = 70 credits
final charge = 330 credits
```

Ultra Premium 10-minute edit:

```text
actual tool cost = 900 credits
length floor = 120 credits
30% fee = 270 credits
service fee = max(120, 270) = 270 credits
final charge = 1170 credits
```

This milestone has no live billing, no Stripe, no Supabase migration, no provider calls, no render/export charging, no wallet mutation, and no credit reservation/spend execution.
