# Edit Level QA And Estimate Contract

Every level must produce a professional edit. Higher levels add QA strictness and estimate metadata, not basic correctness.

| Level | QA profile | Estimate fixture |
| --- | --- | --- |
| Normal | `baseline` | 1.0x credit estimate only. |
| Premium | `premium` | 2.0x credit estimate only. |
| Ultra Premium | `ultra` | 4.0x credit estimate only. |

All estimate profiles are `estimateOnly: true`, `creditsReservedOrSpent: false`, and `needsProductValue: true`.

RP-EDITLEVEL-09 now exposes the mock/local estimate packages behind this contract:

| Level | Time range | Future render/revision/variant |
| --- | --- | --- |
| Normal | 20-45 minutes | 1/1/1 |
| Premium | 45-90 minutes | 2/2/2 |
| Ultra Premium | 90-180 minutes | 3/3/3 |

Render, revision, and variant budgets are future metadata. No credit reservation, credit spend, credit record, render/export, worker, provider call, media processing, real planner execution, or backend billing behavior is implemented.
