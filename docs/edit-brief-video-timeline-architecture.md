# Edit Brief Video Timeline Architecture

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Timeline Shell

- Video/player placeholder tied to the `ProjectEditSession`.
- Timeline scale with visible timecode.
- Playhead position.
- Point Markers at one timestamp.
- Range Markers with start and end time.
- Marker lane grouping for instruction density.
- Future zoom/density controls.
- Future lane types for captions, B-roll, audio, SFX, graphics, and general notes.

## Marker Timing

- Point Marker: `startTimeSeconds` only.
- Range Marker: `startTimeSeconds` and optional `endTimeSeconds`.
- Invalid time ranges should become QA conflicts later.

## Non-Goals

- No trimming.
- No cutting.
- No render preview generation.
- No ffprobe real analysis.
- No media processing.
- No file-byte reads.

## Reuse

Existing `Timeline` and `DetailedTimelineDrawer` are visual prior art. Future Brief timeline should be Project Edit Session-owned and marker-oriented.
