# Living Frame Selected-Scene Particle Full-Timeline Remotion Test

Status:
`selected_scene_full_particle_timeline_remotion_composite_green_persistence_and_review_pending`

Contract:
`living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test-v1`

## Purpose

This private internal test closes the selected-scene rendering gap between the
real 105-frame PixiJS `helicopter.downwash` sequence and the existing Remotion
final compositor.

It does not create a second timeline or renderer. MasterTiming remains the
frame authority, the selected-scene publication remains the scene authority,
PixiJS produces only transparent environmental-effect frames, and Remotion
composites every final review frame.

## Exact selected range

The test revalidates and consumes:

- scene `scene.helicopter-motion`;
- component `helicopter.downwash`;
- confirmed 1920×1080 output frame;
- 30 FPS;
- frame 30 through exclusive frame 135;
- 105 exact RGBA PNG inputs;
- selected-scene, MasterTiming, component-geometry, selective-motion, and
  Visual Continuity Pack lineage; and
- one process-bound, single-use private PixiJS output lease.

The 640×360 output is a private ratio-preserving review projection, not a
customer delivery master.

## Bounded Remotion execution

The existing Remotion request contract accepts at most sixteen Living Frame
overlays. The internal adapter therefore uses seven real Remotion renders:

```text
16 + 16 + 16 + 16 + 16 + 16 + 9 = 105 source frames
```

Each chunk:

- uses the existing `tool.remotion.render_approved_composition.v1` operation;
- injects exact server-verified PNG streams without base64 transport;
- keeps the source plate below the Living Frame particle layer;
- keeps the caption plane above the particle layer;
- compiles each frame into an allowlisted two-frame opacity gate;
- runs for the existing minimum 24-frame Remotion duration; and
- emits a private byte stream with its own request and artifact digests.

FFmpeg trims only the known filler frames and concatenates the seven already
composited chunks. It does not composite any particle, caption, or source
layer. Every retained final frame was produced by Remotion.

## Pixel-level evidence

The final 105-frame review is independently probed and fully decoded. QA
proves:

- exact 640×360 dimensions, 30 FPS, and 105-frame duration;
- transparent first and last environmental frames;
- every materially visible particle frame survives composition;
- temporal particle variation and alpha-centroid movement;
- the source plate remains visible throughout;
- captions remain visible above particles throughout; and
- every final frame maps to the exact selected-source frame in order.

The source sequence intentionally contains smooth fade endpoints. Some early
and late frames have non-zero deterministic particle state but are
sub-perceptual after the 1920×1080 to 640×360 review reduction. QA records
those transition frames separately instead of falsely treating them as missing
overlays. A frame is expected to remain perceptibly visible in the review when
both conditions hold:

- source maximum alpha is at least 64/255; and
- projected alpha-weighted coverage is at least eight review pixels.

All perceptibly active frames must produce measured review-pixel differences
and a centroid matching the source-alpha centroid. The sub-perceptual frames
are still consumed, ordered, composited, and digest-bound.

## Authority boundary

This test is sufficient for the private full-timeline rendering dependency.
It keeps false:

- shared operation registration;
- canonical work-graph mutation;
- artifact persistence;
- asset-manifest mutation;
- QA approval;
- private-review approval;
- actual-cost creation;
- customer charging;
- public delivery;
- external beta; and
- production readiness.

The next internal milestone is to persist the private scene package through the
existing create-only artifact/asset owners and bind destination-composite QA
and private review. Customer-production promotion is intentionally deferred.

## Validation

Run:

`npm run smoke:living-frame-selected-scene-environmental-particle-internal-test`

The smoke executes the real PixiJS range, all seven Remotion chunks, final
packaging, full-frame decoding, pixel QA, caption-plane QA, and false-authority
assertions.

## Files

- `src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test.ts`
- `server/living-frame/living-frame-environmental-particle-remotion-internal-composite.ts`
- `server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts`
