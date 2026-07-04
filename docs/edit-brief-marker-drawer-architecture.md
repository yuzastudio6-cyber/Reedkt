# Edit Brief Marker Drawer Architecture

Status: architecture/docs only. This report defines the future `ProjectEditSession` Marker drawer and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Drawer / Popup Contents

- Header with marker title and status.
- Time range editor.
- Marker type.
- Priority.
- Note box.
- Attachments.
- AI mode.
- Intent summary.
- QA/conflict area.
- Actions: save, confirm, delete, close.

## Opening And Closing Rules

- Open by clicking a Marker.
- Close without side effects if unchanged.
- Draft retained only if saved.
- Delete only after explicit user action.
- Confirm only after required fields and conflicts are acceptable.

## Owner Decision

Drawer vs popup remains pending owner approval. Drawer is recommended for dense editing because Marker notes, attachments, intent, and conflicts need room.

## RP-EDITBRIEF-06 Implementation Note

The drawer pattern is now implemented for mock/local marker metadata. It supports Add Marker and Edit Marker modes, time controls, marker type, priority, status, AI mode metadata, title, note, save, confirm, archive, and close. Attachment chips, Marker Chat count, and QA/conflict status are read-only placeholders.

Marker Chat arrives in RP-EDITBRIEF-07. Attachments, export editing, QA/conflict detection, planner application, Supabase persistence, render/progress, workers, providers/models, and credits remain blocked.
