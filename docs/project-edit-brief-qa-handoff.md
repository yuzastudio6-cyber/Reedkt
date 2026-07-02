# Project Edit Brief QA Handoff

Edit Brief is optional. Chat remains default. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Owner approval pending. No migration. No Supabase command.

## Handoff Summary

RP-EDITBRIEF-12 gives QA a consolidated smoke and Playwright path for the complete optional Brief flow. The focused RP-EDITBRIEF-05 through RP-EDITBRIEF-11 specs remain authoritative for individual subflows, while the new E2E spec validates that the pieces work together in the UI.

## Acceptance Signals

- `npm run smoke:project-edit-brief-e2e` passes.
- `npx playwright test tests/e2e/project-edit-brief-e2e.spec.ts` passes.
- Existing Edit Brief smokes through `smoke:project-edit-brief-plan` continue passing.
- Migration count remains 26.
- Git status is report-only and no files are staged or committed.

## Blockers To Escalate

Escalate any failure that requires new route IDs, Supabase schema work, real planner execution, media processing, uploads, workers, render/export/progress, credits, provider/model calls, or `ChatNativeEditor` changes.
