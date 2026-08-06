# Edit Level Selection UI

RP-EDITLEVEL-04 lets users select Normal, Premium, or Ultra Premium in mock/local UI. Selection saves through the RP-EDITLEVEL-03 browser-safe mock API/client and stores canonical values: `normal`, `premium`, and `ultra_premium`.

The existing runtime values remain unchanged. Public Normal maps to legacy `basic`, public Premium maps to legacy `pro`, and public Ultra Premium maps to legacy `premium` only at the current component prop boundary. This preserves source-aware compatibility and avoids confusing public Premium with legacy runtime `premium`.

Selection is mock/local and does not overwrite live planner/tool runtime behavior. There is no live planner integration, production persistence, migration, provider call, media worker, render/export, progress start, or credit spend.

Credit estimate only copy is shown. Render/revision budget is future metadata.

RP-EDITLEVEL-05 is complete as a mock/local tool capability router.

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
