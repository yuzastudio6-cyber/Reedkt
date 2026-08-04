# Revision and Invalidation

## Dependency manifest

Every late-bound caption scene references versions/hashes for:

- canonical transcript and projection transformations;
- edit timeline, shot order/duration, speed, crop/reframe;
- confirmed output frame and platform profile;
- PictureLockManifest and color-managed proxy;
- B-roll, visual, map/chart/browser, Living Frame, lower-third plans/assets;
- masks, tracking, anchors, occupancy evidence;
- transitions and StoryTiming;
- CaptionStyleProfile and fonts;
- renderer/runtime;
- CaptionMotionLock, SoundSync cue/mix;
- approval envelope, approved snapshot, and QA policy.

## Invalidation matrix

| Change | Minimum invalidation |
| --- | --- |
| punctuation cleanup with identical timing/width | projection/layout QA |
| source word, name, number, claim | all dependent projections, timing review, approval as required |
| shot duration/order/speed | affected StoryTiming, motion, sound, render, QA |
| crop/reframe/aspect ratio | occupancy, layout, depth, render, QA; aspect ratio also resets approval per product policy |
| B-roll/visual/Living Frame replacement | affected occupancy, handoff, layout, timing, render |
| mask/tracking/anchor | dependent depth/object scenes and occlusion QA |
| transition timing | linked caption timing/motion/sound |
| font/style metrics | layout, read duration, render, QA |
| motion | motion lock, sound cue/mix, render, QA |
| sound only | SoundSync mix/audio QA |
| renderer/browser/color pipeline | render and visual QA |
| accessible translation | language projection and delivery QA only unless open creative layout uses it |

## Approval behavior

The Caption Approval Envelope defines which local adjustments—such as a small safe-region move, approved font fallback, or motion simplification—can be repaired without broad reapproval. Structural typography, new generation, new provider/tool cost, changed meaning, new intentional occlusion, new handoff, or material visual promise requires revised plan/estimate approval.

Approved records are immutable. Revisions create new plan/artifact versions with `supersedes` lineage. Workers execute exact approved snapshots, never “latest” mutable state.

## Old snapshots

Legacy snapshots decode through versioned adapters. Missing new fields use explicit legacy-safe behavior:

- single stable track;
- top safe plane;
- no intentional occlusion;
- current style/segmentation representation;
- synthetic timing labeled preview-only;
- no cross-system transform;
- existing SRT/VTT/ASS path.

Compatibility must be proven with fixtures before old fields or paths are removed.
