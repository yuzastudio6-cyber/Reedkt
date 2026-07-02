# Project Edit Brief Marker Drawer UI

RP-EDITBRIEF-06 introduces an editable marker drawer for mock/local Edit Brief markers.

Drawer fields:
- `markerType`
- `title`
- `userNote`
- `priority`
- `timeMode`
- `startTimeSeconds`
- `endTimeSeconds`
- `aiMode`
- status display

The drawer supports Add Marker and Edit Marker modes. It includes marker type, priority, time, and AI-mode selectors, title and note fields, Marker Chat, metadata-only attachment controls, selected-marker QA, status controls, and a boundary notice.

AI mode is metadata only. Default Marker Chat uses deterministic local fallback and does not call Qwen, DeepSeek, or any provider. Backend Qwen beta remains gated by server runtime readiness. Attachment upload remains future; the current attachment panel stores metadata-only labels/URLs and never reads files or fetches URLs. QA/conflict detection is deterministic mock metadata only.

Production ready: false. No Supabase command was run, no migration was created, no render starts, no worker starts, no credits are used, and no `ChatNativeEditor` runtime behavior changes.
