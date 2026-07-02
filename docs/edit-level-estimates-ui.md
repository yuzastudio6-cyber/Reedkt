# Edit Level Estimates UI

RP-EDITLEVEL-09 adds visible estimate UI components for available Edit Level surfaces:

- `EditLevelEstimateSummary`
- `EditLevelEstimateItemList`
- `EditLevelCreditEstimateNotice`
- `EditLevelRenderBudgetNotice`
- `EditLevelRevisionBudgetNotice`
- `EditLevelEstimateBoundaryNotice`

The UI appears in `/projects/new`, the existing inline edit-level setup card, planning context, and the Edit Brief summary surface where an edit level is available.

Frontend components import browser-safe `src/lib/edit-level-estimates-*` helpers and shared types only. They do not import backend modules, repositories, MockDatabase, route handlers, provider/model clients, secret/runtime code, credit execution code, worker dispatch, render/export code, or Supabase clients.

Visible copy must say the estimate is estimate-only, no credits are reserved, no credit spend occurs, no credit record is created, and no render starts.
