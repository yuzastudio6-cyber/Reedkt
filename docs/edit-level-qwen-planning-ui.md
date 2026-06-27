# Edit Level Qwen Planning UI

Status: visible mock/local UI summary.

RP-EDITLEVEL-07 adds compact Qwen planning summary UI to available Edit Level surfaces:

- `/projects/new`;
- `InlineEditLevelCard`;
- `InlinePlanningContextCard`;
- `EditBriefSummaryCard`.

The components are presentational and import only browser-safe `src/lib` helpers and shared types. They do not import `src/backend/**`, `MockDatabase`, repositories, route handlers, provider/model clients, secret config, or runtime planner code.

## Components

- `EditLevelQwenPlanningSummary`
- `EditLevelQwenPlanningDimensionList`
- `EditLevelQwenFallbackNotice`
- `EditLevelQwenUsageEstimateNotice`

## Visible Copy

The UI shows:

- Qwen reasoning depth;
- planning pass policy;
- prompt context depth;
- Marker Chat behavior;
- Preference DNA usage;
- QA explanation depth;
- fallback notice;
- estimate-only/no-credits copy.

No progress, render, export, credit-spend, provider-call, Qwen-call, or planner-execution UI is introduced.
