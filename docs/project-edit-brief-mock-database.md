# ProjectEditBrief Mock Database

RP-EDITBRIEF-03 extends `MockDatabase` additively for ProjectEditBrief persistence tests. The new collections are initialized empty by `createMockDatabase`, and `MockProjectEditBriefRepository` seeds them from RP-EDITBRIEF-02 fixtures when the Edit Brief collections are empty.

New collections:

- `projectEditBriefs`
- `projectEditBriefMarkers`
- `projectEditBriefMarkerAttachments`
- `projectEditBriefMarkerMessages`
- `projectEditBriefMarkerIntents`
- `projectEditBriefMarkerConfirmations`
- `projectEditBriefMarkerConflicts`
- `projectEditBriefMarkerRevisions`
- `projectEditBriefApplicationLogs`
- `projectEditSessionExportSettings`

This is a mock repository package only. It creates no API handlers, no frontend route, no production persistence, no migration, no direct Supabase CLI, and no cleanup. Export settings remain ProjectEditSession-owned and are exposed through the repository for Edit Brief use without becoming Brief-owned.

All records remain `mockOnly: true`; attachment rows are metadata-only and do not read files, upload media, create signed URLs, fetch external URLs, or process media.
