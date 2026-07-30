# Late Binding and Picture Lock

## Invariant

Caption Direction is **early-planned, mid-edit reserved, late-resolved, late-rendered**.

Early planning answers what captions should do and what the edit must preserve. Late resolution answers exactly how the typography occupies the finished frame.

## General PictureLockManifest

Picture lock is a shared edit-system contract, not a caption-only flag. The manifest should include:

- edit plan/version and approved snapshot lineage;
- output frame and frame rate;
- timeline/shot order and shot-duration version;
- speed ramps, reframes, crops, and camera changes;
- B-roll, speaker layout, lower thirds, maps, graphics, and Living Frame versions;
- mask, tracking, anchor, and depth evidence versions;
- transition timing version;
- color-managed final or near-final visual proxy;
- source/asset manifest versions;
- lock author, time, and permitted unresolved exceptions.

## CaptionFinishReadiness

Finish readiness passes only when:

- aspect ratio/output frame is confirmed;
- picture-lock dependencies are stable or explicitly exempted;
- canonical transcript and required timing provenance are available;
- final-frame visual proxy and occupancy inputs exist;
- masks/anchors needed by planned depth work are ready;
- structural caption reservations were honored or reviewed;
- StoryTiming can accept final caption requirements;
- approved fonts and renderer paths are available;
- no blocking privacy, claim, identity, or accessibility review remains.

Readiness returns structured blockers and degraded routes. A missing mask may allow a safe top-layer fallback but may not pretend intentional occlusion is ready.

## Blocking preview

During the main edit, a low-cost preview may show approximate boxes, approximate phrases, and reserved zones. It must be labeled `blocking_preview_only`, use no synthetic timing as final evidence, and never be mistaken for the approved final caption scene.

## Staleness

Shot order, duration, speed, crop/reframe, aspect ratio, B-roll, Living Frame, maps, graphics, lower thirds, masks, tracking, transitions, color/look, transcript, or font changes invalidate only affected caption scenes where dependency mapping permits. Structural changes may require plan reapproval; local styling repairs may remain inside the Caption Approval Envelope.
