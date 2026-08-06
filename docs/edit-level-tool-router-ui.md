# Edit Level Tool Router UI

RP-EDITLEVEL-05 updates visible Edit Level UI with compact tool capability summaries.

Available UI surfaces in this checkout:

- `/projects/new`
- `InlineEditLevelCard`
- `InlinePlanningContextCard`
- `EditBriefSummaryCard`

The UI can show reasoning depth, visual understanding depth, transcript/audio/graphics depth, Edit Brief guidance, QA strictness, future-gated tools, estimate-only copy, and fallback notices.

The UI remains user-friendly and does not expose provider secrets, raw runtime config, storage paths, service-role details, or worker internals. React components import browser-safe `src/lib` helpers only and must not import `src/backend/**`, MockDatabase, repositories, route handlers, provider clients, or secret/runtime code.

Missing requested legacy UI surfaces such as `src/components/projects/*` are not recreated as placeholders.
