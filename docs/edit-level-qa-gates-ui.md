# Edit Level QA Gates UI

RP08 adds compact QA summaries to available Edit Level surfaces:

- `/projects/new`
- `InlineEditLevelCard`
- `InlinePlanningContextCard`
- `EditBriefSummaryCard`

The UI shows QA strictness, readiness, required checks, warning checks, blocking checks, future render/revision/credit checks, and fallback notices.

Frontend components import browser-safe `src/lib` helpers and shared types only. They must not import `src/backend/**`, repositories, route handlers, MockDatabase, provider clients, secret/runtime config, Supabase clients, worker dispatchers, render/export code, or credit spend logic.
