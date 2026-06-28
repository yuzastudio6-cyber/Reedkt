# Edit Level Next Tool Router

RP-EDITLEVEL-05 completes the mock/local Level-Aware Tool Capability Router.

The router connects selected Normal, Premium, and Ultra Premium profiles to mock-safe level-aware tool capability packages without changing production execution. It preserves current runtime `basic | pro | premium` compatibility until an explicit migration milestone.

Still not implemented:

- no live planner routing;
- no real Qwen 3.7 or Qwen2.5-VL routing behavior;
- no provider calls;
- no media workers;
- no render/export;
- no credit spend.

Credit estimate only behavior remains active. Render/revision budget is future metadata.

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
