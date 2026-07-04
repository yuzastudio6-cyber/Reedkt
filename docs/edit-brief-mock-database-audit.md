# Edit Brief Mock Database Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing MockDatabase Areas To Reuse Later

- Project Edit Session records and child records.
- Project Edit Session messages.
- Project Edit Session sources.
- Project Edit Session memory.
- Project Edit Session snapshots.
- Project Edit Session versions.
- Project Edit Session previews.
- Project Edit Session revisions.
- Project Edit Session events.
- Media assets and source clip sequences.
- Preference application, setup, QA, edit plan, and DNA artifacts.

## Future Needed Collections

Do not add these in RP-EDITBRIEF-00. They are candidates for later owner-approved architecture:

- `projectEditBriefs`
- `projectEditBriefMarkers`
- `projectEditBriefMarkerAttachments`
- `projectEditBriefMarkerMessages`
- `projectEditBriefMarkerIntents`
- `projectEditBriefMarkerConfirmations`
- `projectEditBriefMarkerConflicts`
- `projectEditBriefApplicationLogs`
- `projectEditSessionExportSettings`

## Collection Ownership Notes

- Brief records should belong to one `ProjectEditSession`.
- Markers should belong to one Brief and one `ProjectEditSession`.
- Marker attachments should reference existing media/source records when available.
- Marker Chat messages should be scoped to marker records, not main Edit Chat messages by default.
- Export settings should belong to `ProjectEditSession` and be accessible from Brief.

## Boundary

No `MockDatabase` collection is added or edited by this audit. No Supabase migration, generated type, remote command, or production persistence work is included.
