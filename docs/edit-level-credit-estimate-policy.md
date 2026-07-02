# Edit Level Credit Estimate Policy

RP-EDITLEVEL-09 uses multiplier-only credit ranges for edit-level selection copy.

| Level | Credit multiplier | Billing status |
| --- | --- | --- |
| Normal | 1.0x | `needsProductValue` |
| Premium | 2.0x | `needsProductValue` |
| Ultra Premium | 4.0x | `needsProductValue` |

The multiplier is not a billable credit price. It is a placeholder signal that higher levels may require more future tool depth, analysis, QA, render budget, revision budget, and degraded fallback handling.

There is no credit reservation, no credit spend, no credit record, no wallet mutation, no Stripe flow, no settlement, and no export lock enforcement in RP09. Credit execution remains behind future approved-plan, credit estimate approval, reservation, ledger, and settlement gates.
