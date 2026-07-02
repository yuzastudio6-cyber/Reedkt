# Edit Level Session Brief Display

RP-EDITLEVEL-04 shows the selected public Edit Level in available session and brief-adjacent surfaces without modifying `ChatNativeEditor` runtime behavior.

Available integration points in this checkout:

- `/projects/new` setup page shows Edit Level cards and selection summary.
- `InlineEditLevelCard` renders Normal, Premium, and Ultra Premium while preserving legacy props for the existing editor.
- `InlinePlanningContextCard` shows the public selected level in Edit Chat context.
- `EditBriefSummaryCard` can show selected-level policy and Edit Brief guidance from existing `plannerInput.editLevel`.

Missing requested legacy surfaces remain unavailable and are not recreated as placeholders: `ProjectHomePage`, `ProjectEditSessionChatPage`, `src/components/projects/*`, and `src/lib/internal-testing-scenarios.ts`.

This is mock/local UI only. There is no live planner behavior. Credit estimate only copy is visible, and render/revision budget is future metadata.

RP-EDITLEVEL-05 is complete as a mock/local tool capability router.

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
