# Project Edit Brief Route Client Known Limitations

Milestone: RP-EDITBRIEF-04A - Route + Client QA Closure

Status: verified mock/local QA closure only.

## Limitations

- No Edit Brief UI yet.
- No `/brief` route yet.
- No marker creation UI.
- No marker drawer UI.
- No Marker Chat UI.
- No attachments UI.
- No export settings UI.
- No planner execution.
- No Qwen or DeepSeek calls.
- No provider/model calls.
- No workers.
- No render, progress, preview, or export execution.
- No uploads.
- No file-byte reads.
- No external URL fetch.
- No media processing.
- No storage writes or signed URLs.
- No credit reservation or spend.
- No Supabase read/write, migration, direct CLI command, remote inspection, remote SQL, or typegen.

## Product Boundary

ProjectEditBrief remains optional mock/local planning metadata inside a `ProjectEditSession`. Edit Chat remains the default workspace, Marker Chat remains future marker-scoped UI, and Edit Preference remains reusable style/DNA rather than a session or brief.

## Production Status

Production ready: false. Owner approval remains pending before RP-EDITBRIEF-05 or any production enablement work.

## RP-EDITBRIEF-04A Verification

These limitations remained intact after RP-EDITBRIEF-04A smokes, QA wrappers, build, lint, frontend-boundary, and requested Playwright specs. No limitation was converted into runtime behavior.
