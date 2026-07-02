# ProjectEditBrief Repository Layer

RP-EDITBRIEF-03 adds the mock repository seam for `ProjectEditBrief` state. The mock repository sits below future Edit Brief API/client work and above `MockDatabase` collections for briefs, markers, marker attachments, Marker Chat messages, structured marker intent, confirmations, conflicts, revisions, application logs, and ProjectEditSession-owned export settings.

This is a mock repository only. It adds no API handlers, no UI routes, no ProjectEditSessionChatPage runtime behavior, no ChatNativeEditor runtime behavior, no migration, no direct Supabase CLI, no provider/model calls, no workers, no rendering, no uploads, no file-byte reads, and no credits.

## Covered Operations

- Brief get, get-for-session, create, update, and archive.
- Marker list, get, create, update, delete, confirm, and archive.
- Marker attachment add, list, and remove.
- Marker Chat message append and list.
- Structured marker intent get, save, and update.
- Confirmation, conflict, revision, and application log save/list operations.
- ProjectEditSession export settings get, recommend, and update.
- Timeline marker models, marker drawer model, full bundle, and readable summaries.

## Count Maintenance

The mock repository owns lightweight consistency rules:

- Marker create, delete, archive, and confirm recompute brief marker counts.
- Attachment add/remove recomputes the marker attachment count.
- Marker Chat append recomputes the marker message count.
- Intent save links `marker.intentId`.
- Conflict save updates marker QA status and recomputes brief conflict counts.

Owner decisions remain pending. RP-EDITBRIEF-04 should add mock API routes and a browser-safe client only after review.
