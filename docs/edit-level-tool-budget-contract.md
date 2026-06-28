# Edit Level Tool Budget Contract

Tool budget is future planning metadata. It does not install tools, execute workers, call providers, process media, render/export, or reserve/spend credits.

| Level | Tool budget | Capability posture |
| --- | --- | --- |
| Normal | `minimal_professional` | Required basics plus targeted visual context when needed. |
| Premium | `medium` | Deeper source package, key moments, styled captions/cards, music/SFX/ducking guidance. |
| Ultra Premium | `highest` | Scene-level context, sound design planning, motion/card direction, strict QA, and higher future budget. |

Capability statuses are explicit: `available_mock`, `available_beta`, `runtime_disabled`, `provider_required`, `worker_required`, `future_gated`, or `not_required`.

Unavailable tools must trigger fallback/degraded capability notices instead of overclaiming.
