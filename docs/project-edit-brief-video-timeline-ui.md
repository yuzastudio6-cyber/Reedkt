# Project Edit Brief Video Timeline UI

RP-EDITBRIEF-05 adds a mock video/timeline surface for Edit Brief review.

## UI Model

- Video shell: placeholder frame, mock play/pause controls, timecode, aspect label, and no real playback.
- Timeline: bounded duration, ruler ticks, playhead, marker lane, point/range marker pills, marker type labels, status labels, and local selection.
- Data source: browser-safe Project Edit Brief API client backed by mock fixtures.

## Behavior

Opening the Brief route is non-mutating. It does not create a Brief, create a marker, start playback, inspect frames, process media, render previews, run workers, call providers, call models, reserve credits, read files, fetch URLs, or write Supabase.

Current mock/local status: later Edit Brief milestones added explicit marker creation/editing, Marker Chat, metadata-only attachments, Export Settings editing, deterministic QA, and mock Plan Hints on top of this shell. Those actions are still metadata-only and user-initiated; opening the Brief route by itself remains safe and non-mutating.
