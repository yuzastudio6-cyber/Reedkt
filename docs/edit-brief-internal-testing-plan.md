# Edit Brief Internal Testing Plan

Status: architecture/docs only. This report plans future `ProjectEditSession` Brief tests and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Test Scenarios

- Brief tab visible.
- Brief opens and closes.
- Video/timeline shell visible.
- Create Marker.
- Open Marker drawer.
- Save Marker note.
- Marker appears on timeline.
- Marker Chat optional.
- Attach metadata-only asset.
- Export Settings visible.
- Conflict warning visible.
- Return to Chat.
- No render/progress/credits.

## Test Boundaries

- No direct Supabase CLI.
- No migration.
- No provider/model call.
- No worker.
- No render.
- No upload or file-byte read.
- No credit reservation/spend.
- No `ChatNativeEditor` runtime change.

## Future Coverage Order

Start with smoke coverage for types/contracts, then repository/API/client smokes, then UI shell Playwright, then Marker interactions, Marker Chat, attachments, export settings, QA/conflict, and planner integration.
