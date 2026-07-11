# Edit Level Estimate And Budget Architecture

This document defines future estimate and budget metadata. It does not implement billing, reservations, rendering, workers, or credit spend.

## Future Estimate Dimensions

- `timeEstimateRange`
- `creditEstimateMultiplier`
- `analysisPassBudget`
- `qwenReasoningPassBudget`
- `qwen25vlVisualPassBudget`
- `workerPassBudgetFuture`
- `renderPassBudgetFuture`
- `revisionBudgetFuture`
- `variantBudgetFuture`

## RP09 Placeholder Multipliers

| Level | Placeholder architecture value |
| --- | --- |
| Normal | 1.0x |
| Premium | 2.0x |
| Ultra Premium | 4.0x |

Final values are `needs_product_value`.

## RP09 Time Ranges

| Level | Mock/local range |
| --- | --- |
| Normal | 20-45 minutes |
| Premium | 45-90 minutes |
| Ultra Premium | 90-180 minutes |

## Product Rules

- All values are credit estimate only until future credit gates exist.
- Selecting an Edit Level does not reserve or spend credits.
- Render budget future, revision budget future, and variant budget future are planning metadata until production render/workers exist.
- Higher estimates should show lower-cost alternatives when useful.

## Boundary

No credit reservation, credit spend, credit record, release, refund, Stripe call, render/export, provider call, worker dispatch, migration, production persistence, or backend execution is added in RP-EDITLEVEL-09.
