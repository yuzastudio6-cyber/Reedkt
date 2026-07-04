# Edit Brief Reuse Vs New Build Plan

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Decision Table

| Existing surface | Reuse? | Wrap? | Build new? | Reason | Risk |
| --- | --- | --- | --- | --- | --- |
| ProjectEditSession route/navigation | Yes | Yes | Add `/brief` later | Existing section/tabs model fits Brief as optional section. | Medium |
| Project Edit Session API/client/repository patterns | Yes | Yes | Brief-specific route/repository later | Existing mock/local safety and session-scoped persistence patterns are strong. | Low |
| Project Edit Session memory/history | Yes | Yes | Marker event/memory bridge later | Marker summaries should feed history/memory without raw Marker Chat mixing. | Medium |
| Media asset repository metadata model | Yes | Yes | Marker attachment records later | Attachments can be metadata-only first. | Low |
| Source sequence/source order concepts | Yes | Yes | Marker source context later | Markers need source/time context. | Low |
| Preference DNA application concepts | Yes | Yes | Marker precedence policy later | Markers should override reusable DNA only when confirmed and safe. | Medium |
| Existing Edit Brief types/hooks/panels | Maybe | Likely | ProjectEditSession-owned Brief model later | Existing implementation is clean-assembly/editor-oriented. | High |
| Existing Edit Cue model | Maybe | Likely | Marker model later | Cue anchors/roles are close to Marker needs but naming/ownership differ. | High |
| Production timeline workers | Future only | No | No now | Worker/render gates blocked. | High |

## Expected New Future Surfaces

- Edit Brief record.
- Marker record.
- Marker attachment record.
- Marker scoped chat.
- Marker intent record.
- Marker confirmation record.
- Marker conflict record.
- Export settings recommendation/service.

## Recommendation

RP-EDITBRIEF-01 should not start with UI. It should first settle naming and architecture around whether future Marker wraps existing Edit Cue concepts or introduces a new session-owned model with a compatibility map.

## RP-EDITBRIEF-01 Update

RP-EDITBRIEF-01 is the architecture map, not UI or runtime implementation. It documents Marker as a future `ProjectEditSession` layer while keeping existing Edit Cue code as prior art. Next recommended work is RP-EDITBRIEF-02 types/contracts/mock fixtures after owner review.

## RP-EDITBRIEF-02 Update

RP-EDITBRIEF-02 keeps existing Edit Brief/Edit Cue code as prior art and introduces a separate `ProjectEditBrief*` mock contract layer. Reuse remains planned around Project Edit Session route/client/repository patterns, memory/history patterns, media/source metadata, and Preference DNA concepts. New runtime build remains future: no repository, API handler, UI route, migration, direct Supabase CLI, staging, commit, cleanup, delete, move, or rename.
## RP-EDITBRIEF-03 Reuse Decision

The repository layer reuses RP-EDITBRIEF-02 fixtures and mappers for timeline, marker drawer, bundle, and readable summaries. New code is limited to the repository seam, MockDatabase collections, row mappers, validation/summary helpers, disabled Supabase skeleton, scenarios, contracts, and smoke coverage.

No API handlers, no UI routes, no runtime behavior, no migration, no direct Supabase CLI, no staging/commit/cleanup. Future RP-EDITBRIEF-04 should reuse this repository seam rather than letting route handlers mutate MockDatabase directly.
