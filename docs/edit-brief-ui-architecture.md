# Edit Brief UI Architecture

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Layout

| Area | Purpose | Notes |
| --- | --- | --- |
| Header | Show Edit Brief title, mock/local boundary, route context, and close/back affordance. | Chat remains default. |
| Video/player preview area | Show mock preview/player placeholder for the `ProjectEditSession`. | No real render/export/media processing. |
| Timeline | Show time scale, playhead, and marker density. | No trim/cut controls. |
| Marker lane | Show point and range Markers. | Click opens drawer/popup later. |
| Marker drawer/popup | Edit type, priority, status, note, attachments, AI mode, intent, QA/conflicts. | Opening/closing unchanged drawer has no side effects. |
| Attachment chips | Show metadata-only assets as clean chips/labels. | No messy asset dump, no upload, no URL fetch. |
| Optional Marker Chat | Scoped chat for one Marker. | Not the main Edit Chat. |
| Export Settings shortcut | Show session-level recommended export settings. | Settings belong to `ProjectEditSession`. |
| Brief summary area | Show confirmed markers, warnings, conflicts, and readiness. | Planner consumes later. |

## UI Rules

- Keep the UI clean and professional for advanced users.
- Assets appear as chips/labels with later preview affordances.
- No trimming, cutting, rendering, progress, generation, or export controls.
- No automatic planning or execution when opening Brief.
- Marker actions are saved only by explicit user action in future milestones.

## Existing Surface Reuse

Use existing Project Edit Session navigation and styling patterns later. Existing editor `edit-brief`, `edit-cue`, `Timeline`, and `DetailedTimelineDrawer` surfaces are prior art only in RP-EDITBRIEF-01.
