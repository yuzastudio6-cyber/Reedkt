# Project Edit Brief UI Shell Boundary

RP-EDITBRIEF-05 started as a mock/local route and UI milestone. RP-EDITBRIEF-06 adds explicit mock/local marker creation and marker drawer editing on the same Brief route.

## Allowed

- Render `/projects/:projectId/edits/:editSessionId/brief`.
- Read fixture-backed Project Edit Brief records through browser-safe client helpers.
- Select markers locally in React state.
- Move the playhead by clicking the empty timeline.
- Create, update, confirm, and archive marker metadata through the browser-safe mock Project Edit Brief API client.
- Show empty states for optional/not-opened or no-marker briefs.
- Show read-only export settings and marker metadata.

## Blocked

No Marker Chat UI, attachment upload, export editing, QA/conflict detection, planner application, file-byte read, external URL fetch, signed URL, real playback, media processing, Qwen, DeepSeek, providers, workers, render/progress, credits, Supabase command, migration, production route, `ChatNativeEditor` change, staging, commit, cleanup, delete, move, or rename.

Production ready: false. Owner decisions remain pending.

No Supabase command was run or required.
