# Edit Level Selection Lifecycle

RP-EDITLEVEL-03 supports a mock selection lifecycle, and RP-EDITLEVEL-04 exposes it in visible UI:

- create a deterministic recommendation;
- save a source-aware selection;
- get the saved selection;
- update the selection with another source-aware input;
- clear the selection;
- append and list mock application logs.

Legacy compatibility remains source-aware: `legacy_runtime` `premium` maps to Ultra Premium, while `public_beta` or `explicit_canonical` `premium` remains Premium. This does not rename or modify the current runtime `basic | pro | premium` behavior.

Selections are not locked into runtime planning in RP-EDITLEVEL-03. There is no runtime implementation, no live UI wiring, no production persistence, no migration, no provider/model call, no media worker, no render/export, no progress update, and no credit spend.

RP-EDITLEVEL-04 adds visible selection state, but still no live planner/tool routing, render/export, progress update, or credit spend.

RP-EDITLEVEL-05 is complete as a mock/local tool capability router.

Recommended next prompt: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
