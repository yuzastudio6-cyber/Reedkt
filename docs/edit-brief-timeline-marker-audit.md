# Edit Brief Timeline And Marker Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

This audit covers existing timeline, playhead, marker, timecode, time range, annotation, chapter, cue, trim, cut, b-roll note, caption note, and music cue concepts. It treats current `edit-brief` and `edit-cue` code as existing surfaces only.

## What Exists Now

| Concept | Existing surface | Current state | Reuse decision |
| --- | --- | --- | --- |
| Timeline display | `src/components/Timeline.tsx`, `src/components/editor/DetailedTimelineDrawer.tsx` | Mock layer timing UI for checking captions, visuals, SFX, music, AI clips, and Remotion layers. | Reuse visual patterns only; Brief needs a marker lane and playhead-aware selection later. |
| Time/range cue anchors | `src/types/edit-cue.ts` `EditCueTimeRangeAnchor` | Supports optional time range and clean assembly/source timebase. | Strong candidate for future Marker timing semantics. |
| Transcript/scene/asset anchors | `src/types/edit-cue.ts` | Existing cue anchors for transcript ranges, scenes, and assets. | Reuse as prior art for marker source links. |
| Cue roles | `src/types/edit-cue.ts` `EditCueRole` | B-roll, overlay, insert, caption instruction, graphic, SFX, music, reference, avoid. | Map to future marker type list after owner approval. |
| Cue validation/conflicts | `src/lib/edit-cues/*`, `src/types/edit-cue-conflict.ts` | Blocking/warning cue conflicts and remap behavior. | Reuse conflict concepts; future Marker conflict records should be session-scoped. |
| Clean assembly actions | `src/types/clean-assembly.ts` includes `add_edit_brief` | Legacy/production workflow action naming. | Audit only. |
| Production timeline workers | `server/workers/timeline/*` | Production timeline manifest/execution artifacts. | Future/blocked; do not execute or couple to Brief in this milestone. |

## What Is Only Mock Or Unrelated

- The existing `Timeline` and `DetailedTimelineDrawer` are timing/inspection UI, not an editable Brief timeline.
- Existing Edit Cue panels are tied to the editor/footage-prep flow, not the persistent Project Edit Session route model.
- Production timeline worker files are not safe to treat as runtime dependencies for Edit Brief until worker/render gates exist.
- Current Project Edit Session history timeline is snapshot/event history, not a video playhead timeline.

## What Must Be Built New Later

- Project Edit Session-owned Edit Brief record.
- Marker record with time-specific/range-specific anchor, status, type, priority, and confirmed intent.
- Marker lane and selected marker drawer/popup.
- Marker-scoped chat and marker intent/confirmation/conflict records.
- Marker-to-planner bridge with priority over main chat and Edit Preference/DNA.

## Expected Decision

Build Edit Brief marker model as a new layer under `ProjectEditSession`, while reusing existing source/media/history/memory seams and carefully mapping or wrapping existing Edit Cue concepts. Owner decisions remain pending for marker types, statuses, drawer vs popup, and whether the user-facing term is Marker or Cue.
