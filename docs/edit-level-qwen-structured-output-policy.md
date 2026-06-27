# Edit Level Qwen Structured Output Policy

Status: mock/local structured output policy only.

RP-EDITLEVEL-07 defines the shape of future Qwen planning hints by Edit Level. These hints are not production edit plans and are not consumed by runtime planners in this milestone.

## Policies

| Level | Structured output policy | Intent |
| --- | --- | --- |
| Normal | simple professional plan hints | Clean, efficient planning hints that keep the edit professional without adding unnecessary complexity. |
| Premium | layered creative plan hints | Deeper creative treatment, marker reasoning, source context, Preference DNA, and concise QA warnings. |
| Ultra Premium | studio multi-layer plan hints | Studio-level multi-layer guidance, scene context, QA-aware marker reasoning, continuity, and richer creative direction. |

## Not A Plan

The structured output policy does not create an edit plan. It does not create segment operations, approved snapshots, worker jobs, render jobs, progress UI, or credit reservations. It is a future contract for how Qwen 3.7 should format reasoning output once a later backend planner milestone exists.

## Fallback

When Qwen is unavailable, deterministic fallback summaries remain acceptable:

- Normal may use deterministic professional fallback.
- Premium must show a degraded fallback notice.
- Ultra Premium degrades to Premium-safe reasoning with a clear notice.

Next milestone: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.
