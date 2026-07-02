# Project Edit Brief Marker Creation Flow

RP-EDITBRIEF-06 adds mock/local marker creation and drawer editing inside the Edit Brief route.

Users can open an Edit Chat, click the Brief tab, move the playhead, click Add Marker, choose a marker type, choose point or range timing, set priority, add title/note text, store AI mode metadata, and save a marker. The marker appears on the mock timeline after the browser-safe Project Edit Brief API client writes to local fixture state.

Supported mock actions:
- Save a new marker.
- Update marker type, title, note, priority, time mode, start/end time, and AI mode metadata.
- Confirm a marker, which sets the mock marker status to `confirmed`.
- Archive a marker, which hides it from the active timeline.

Current mock/local follow-ups are available in the same drawer/workspace: Marker Chat with deterministic local fallback, metadata-only attachments, deterministic QA/conflict checks, editable session-level Export Settings, and mock Plan Hints. Real uploads, provider/model calls, media processing, workers, rendering/export/progress, Supabase persistence, and credits remain blocked.

Production ready: false. This flow is mock/local metadata only. No Supabase command was run, no migration was created, no upload starts, no file bytes are read, no external URL is fetched, no media processing starts, no provider/model call occurs, no worker starts, no render starts, and no credits are reserved or spent.
