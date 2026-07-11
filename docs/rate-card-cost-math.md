# Rate Card Cost Math

RP-RATECARD-01 hardens the mock-safe rate card and cost math layer for tool-cost metering. It keeps one canonical placeholder rate card in `server/tool-cost-metering`, uses integer micros/cents/credits, and keeps `serviceFeeIncluded = false`.

RP-TOOLCOST-01 wires the production tool registry to this rate card through derived owner coverage and mock-safe estimate/event adapters. See `docs/production-tool-cost-owner-coverage.md`, `docs/production-tool-cost-estimate-event-adapter.md`, and `smoke:production-tool-cost`.

RP-ESTIMATE-01 consumes production tool estimate ranges from this layer and adds ReEditPro service/edit fee separately in the mock estimate preview. See `docs/edit-credit-estimate-preview.md` and `smoke:credit-estimate`.

The rate card is mock-safe: no live billing, no Stripe/payment flow, no provider call, no Supabase migration, no wallet mutation, no reservation spend/release/refund, no ledger write, no render/export execution, and no export unlock.

## Boundaries

- Tool-cost events store actual internal tool cost only.
- Product edit levels remain `normal`, `premium`, and `ultra_premium`.
- Tool/runtime compute levels remain separate: `economy`, `standard`, and `premium`.
- ReEditPro service fee is calculated by the existing credit policy and settlement preview layer, not by tool owners.
- Settlement preview stays read-only and only summarizes billable vs non-billable mock events.

## Math

- `COST_MICROS_PER_CENT = 10_000`.
- `creditValueCents = 10`.
- micros convert to cents with `ceil(micros / 10_000)`.
- cents convert to credits with `ceil(cents / 10)`.
- Billable runtime uses a minimum billable duration and rounding increment from the mock-safe rate card.
- Estimate ranges return low, expected, and high internal costs with risk buffers, and they exclude ReEditPro service fee.

`smoke:rate-card` and the alias `smoke:tool-cost-metering` verify conversion, provider/runtime/deterministic cost math, pricing snapshot safety, non-billable exclusion, and the read-only settlement-preview bridge. `smoke:production-tool-cost` verifies 49/49 production tool owner coverage plus estimate/event adapter behavior. `smoke:credit-estimate` verifies the user-facing estimate preview bridge.
