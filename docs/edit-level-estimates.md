# RP-EDITLEVEL-09 Estimate Policy

Status: complete as mock/local estimate policy only.

RP-EDITLEVEL-09 adds level-aware estimate packages for Normal, Premium, and Ultra Premium. The packages explain expected time, credit multiplier placeholder, analysis depth, future render pass budget, future revision budget, future variant budget, degraded capability impact, and estimate-only boundaries.

This is not live billing or execution. There is no credit reservation, no credit spend, no credit record, no render/export, no worker, no provider call, no real planner execution, no media processing, no Supabase write, no migration, no file-byte read, and no external fetch.

## Product Levels

| Level | Time range | Credit multiplier | Package status |
| --- | --- | --- | --- |
| Normal | 20-45 minutes | 1.0x | estimate_ready_mock |
| Premium | 45-90 minutes | 2.0x | estimate_ready_with_warnings |
| Ultra Premium | 90-180 minutes | 4.0x | estimate_degraded_by_missing_tool |

The multiplier values are fixture placeholders from the existing edit-level profile budgets. They are multiplier-only forecasts, not numeric billable credit prices. Product-sensitive values remain `needsProductValue`.

## Boundary

All RP09 package and item records keep `mockOnly: true`, `estimateOnly: true`, `creditsReservedOrSpent: false`, `creditRecordCreated: false`, `renderJobCreated: false`, `workerJobCreated: false`, and `progressStarted: false`.

The recommended next milestone is RP-EDITLEVEL-10 - End-to-End Internal Testing + Playwright Coverage.
