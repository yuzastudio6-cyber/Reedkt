# Project Edit Brief UI Shell

Milestone: RP-EDITBRIEF-05 - Brief UI Shell: Video Player + Timeline.

Status: mock/local UI shell. The route `/projects/:projectId/edits/:editSessionId/brief` renders an optional Edit Brief workspace inside the existing `ProjectEditSession` route system.

## What Exists

- Brief route tab beside Chat, History, Versions, Preview, and Details.
- Read-only Brief header, mock video frame, timecode controls, timeline ruler, playhead, marker lane, marker pills, marker detail panel, export settings summary, empty states, and boundary notices.
- Browser-safe `project-edit-brief-ui-adapter` using only Project Edit Brief API client helpers.
- Marker-rich fixture coverage through `edit-session-youtube-wide`.
- Optional-not-opened coverage through `edit-session-vertical-dna`.

## Boundary

No marker creation, marker editing, marker deletion, marker confirmation, Marker Chat UI, upload UI, file-byte read, external URL fetch, signed URL, media processing, real playback, provider/model call, worker, render/progress, credit action, Supabase command, migration, staging, commit, or cleanup.

No Supabase command was run or required.

Production ready: false. Owner decisions remain pending. Recommended next milestone after owner review: RP-EDITBRIEF-06 - Marker Creation + Marker Drawer.
