# Edit Brief Marker QA And Conflict Architecture

Status: architecture/docs only. This report defines future `ProjectEditSession` Marker QA/conflicts and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Conflict Examples

- Music marker vs no music session.
- SFX marker vs no fake sounds.
- Cut marker overlaps B-roll marker.
- Exact reference copy risk.
- Missing required asset.
- Invalid time range.
- Conflicting high-priority markers.

## QA Statuses

- `passed`
- `warning`
- `needs_clarification`
- `needs_asset`
- `conflict`
- `blocked`

## QA Inputs

- Marker type/status/priority.
- Time range validity.
- Attachment availability.
- Session do-not-copy rules.
- Edit Preference / Preference DNA constraints.
- Export Settings constraints.
- Other Markers in overlapping time ranges.

## Boundary

Marker QA is deterministic/local in the future mock phase. No model call, worker, render, credit, Supabase write, or production route is implied.
