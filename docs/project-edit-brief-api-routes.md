# Project Edit Brief API Routes

RP-EDITBRIEF-04 adds 35 mock/local `ProjectEditBrief` route IDs under the shared route registry. The routes cover briefs, markers, marker attachments, Marker Chat messages, marker intent, confirmations, conflicts, revisions, application logs, session export settings, timeline models, and marker drawer models.

All routes are `mock_local`, `mockOnly: true`, `productionReady: false`, and registered under the `projects` API domain with route group `project_edit_brief`.

No production HTTP route is created. No Supabase command, migration, storage write, signed URL, file-byte read, external URL fetch, media processing, provider call, worker job, generation request, render job, or credit action is enabled.

The next implementation milestone remains `RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline`, pending owner review.
