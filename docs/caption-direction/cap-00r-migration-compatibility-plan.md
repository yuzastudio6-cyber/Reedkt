# CAP-00R Migration and Compatibility Plan

## Phase 1 — clean public foundations

1. Freeze CAP-00R docs on the clean backend base.
2. Recheck for a published dependency-complete neutral specialist-contract
   commit before CAP-01.
3. Add or consume the one shared manifest v2/qualification/call/support/result
   family with v1 decode support.
4. Implement `captions` manifest and standalone harness without changing
   current planner runtime.

## Phase 2 — internal composite and domain

1. Add `caption_design` and component relationships to the existing catalog.
2. Map legacy `captions.*` IDs and the `caption_direction` alias.
3. Keep `no_captions` mutually exclusive.
4. Introduce versioned domain contracts and strict validators.
5. Preserve existing simple caption planning and output as legacy-safe adapters.

## Phase 3 — dependency adapters

1. Bind canonical transcript and timing provenance.
2. Bind shared PictureLockManifest and StoryTiming.
3. Bind Visual Intelligence support for occupancy and rendered inspection.
4. Bind Track All support for masks, tracks, anchors, and occlusion.
5. Bind frozen CAP-11, Transition, B-roll/camera, and Sound payloads through
   neutral support-request lineage.
6. Keep all receiver refs opaque and all external authorities false.

## Phase 4 — rendering, QA, UI, persistence

1. Add current-frame Remotion and libass paths without changing final-canvas
   ownership.
2. Add accessibility, localization, reduced-motion, and multi-output
   recomposition.
3. Extend canonical snapshot/work/asset/estimate/private-review owners through
   public adapters.
4. Require deterministic QA plus direct visual inspection.
5. Restore completed UI state only through authenticated canonical reread.

## Phase 5 — requalification and retirement

1. Reproduce every adopted preservation-tree test on the clean branch.
2. Run old-plan/snapshot/style/ID compatibility fixtures.
3. Run real-media CAP-18 matrix and CAP-20 aggregate.
4. Freeze rollback mappings.
5. Retire direct Qwen/SAM, fixed-canvas/system-font, synthetic-final-timing, and
   flat-owner paths only after dependency-complete evidence.

## Version behavior

- Unknown versions fail closed.
- Historical manifest v1 remains readable; new specialist fields live in v2.
- Old snapshots decode to one stable top-layer track, no intentional occlusion,
  no cross-system transform, preview-only synthetic timing, and existing
  SRT/VTT/ASS output.
- Missing new evidence never silently becomes `qualified` or `completed`.
- Revisions create new immutable versions and `supersedes` lineage.
- Aspect ratio, transcript, timeline, masks, fonts, StoryTiming, receiver, or
  approved-snapshot drift invalidates only mapped dependent scopes unless the
  approved envelope requires broader reapproval.

## Publication strategy

Each CAP milestone is a small pushed checkpoint. No broad cherry-pick or
preservation-tree merge is permitted. If the backend owner publishes a new
dependency foundation, rebase or merge only after exact dependency and diff
review; record the new base in the branch ledger.
