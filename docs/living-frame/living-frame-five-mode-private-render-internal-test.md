# Living Frame Five-Mode Private Render Internal Test

Status: verified private/internal runtime evidence

Entrypoint:
`npm run smoke:living-frame-five-mode-private-render`

Implementation:
`server/smoke/living-frame-five-mode-private-render-smoke.ts`

## Purpose

This internal test proves that Living Frame's product definition is executable
across all five modes. It is not a metadata-only capability matrix and it does
not equate Living Frame with a universal 2.5D treatment.

One real 180-frame, 640×360, 30 FPS private Remotion artifact contains six
frame-accurate ranges:

1. `living_a_roll`;
2. `living_still`;
3. `living_archive`;
4. `living_diagram`;
5. `hybrid_expansion`; and
6. deliberate non-use for an emotionally sensitive range.

All Living Frame layers remain below the caption plane. The source plate and
audio remain owned by the existing final composition, and the resulting MP4 is
persisted and reopened through the existing canonical private Remotion artifact
storage owner.

## Mode assertions

### Living A-Roll

The fixture keeps the speaker/source frame active and introduces the visual in
safe negative space. Actual decoded pixels prove:

- the explanatory component enters and settles;
- a smooth source-plane focus and luminance handoff occurs;
- source attention returns by the end of the range; and
- captions remain above the Living Frame visual.

This fixture deliberately exercises the safe-space fallback. It does not claim
that temporal behind/in-front subject masking is qualified.

### Living Still

The source still is split into a static body anchor and an independent
mechanical component. Actual decoded pixels prove that the rotor changes from a
horizontal to a vertical orientation while the body remains a separate stable
layer.

This is selective, deterministic component animation rather than generated
video.

### Living Archive

Two document layers occupy different depth bands under one shared virtual
camera move. Actual decoded pixels prove differential parallax: the foreground
document travels materially farther than the background document.

This verifies a deep-multiplane 2.5D treatment while preserving the rule that
2.5D is a scene decision, not the Living Frame parent style.

### Living Diagram

An exact deterministic relationship graphic is revealed and positioned without
image generation. Pixel counts prove the approved diagram transitions from
sub-perceptual to fully visible while captions retain priority.

### Hybrid Expansion

The visual begins as an in-frame panel, expands beyond the source frame, and
returns to its initial scale. Pixel-area measurements prove both expansion and
restoration, and decoded caption pixels prove that the final canvas ordering is
preserved during the takeover.

### Deliberate non-use

The final range contains no Living Frame overlay. Pixel checks reject residual
cyan, green, or purple Living Frame components while retaining the source and
caption planes. This is runtime evidence that restraint is an executable
professional decision rather than documentation-only guidance.

## Runtime and QA evidence

The test executes:

- the pinned private Remotion runtime;
- server-injected, digest-bound source, caption, and RGBA component streams;
- canonical scalar motion specs with exact frame ranges;
- create-only canonical private artifact persistence;
- exact digest and byte-length readback;
- real FFmpeg frame extraction;
- real FFprobe width, height, frame-rate, and frame-count inspection; and
- pixel-level motion, scale, depth, visibility, restoration, caption-order, and
  non-use assertions.

The expected final artifact is:

```text
H.264 MP4
640×360
30/1 FPS
180 frames
```

## Authority boundary

This evidence is authorized for private internal testing only. It grants no:

- customer billing authority;
- public delivery authority;
- provider or cloud deployment authority;
- production registry promotion;
- production worker dispatch; or
- customer-release claim.

Those boundaries do not reduce the internal evidence: the renderer, media
inspection, artifact persistence, and pixel QA are real executions rather than
mock plans.
