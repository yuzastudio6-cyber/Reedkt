# Edit Level UI Boundary

RP-EDITLEVEL-04 is a visible UI milestone, not a runtime execution milestone.

The UI states:

- changing level adjusts planned depth and polish;
- selection is mock/local;
- no live planner or tool routing changes are made;
- no Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, media worker, render/export, progress, or credit operation starts from selection;
- credit estimate only copy is visible;
- render/revision budget is future metadata.

React components import browser-safe `src/lib` helpers and shared UI primitives only. They do not import `src/backend/**`, MockDatabase, repositories, route handlers, provider clients, or secret/runtime code.

RP-EDITLEVEL-05 is complete as a mock/local tool capability router.

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
