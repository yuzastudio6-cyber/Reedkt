# Edit Level Render Budget Policy

RP-EDITLEVEL-09 documents future render and variant budget metadata only.

| Level | Future render pass budget | Future variant budget |
| --- | ---: | ---: |
| Normal | 1 | 1 |
| Premium | 2 | 2 |
| Ultra Premium | 3 | 3 |

Render and variant budget items are `futureGated: true` and `estimateOnly: true`.

RP09 does not start render/export, create render jobs, enqueue workers, call providers, run Remotion, unlock export, or spend credits. Future render budget execution must remain behind approved snapshots, dependency readiness, QA gates, and credit approval.
