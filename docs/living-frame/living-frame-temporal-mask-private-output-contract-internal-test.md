# Living Frame temporal-mask private output-contract test

## Purpose

Run:

```text
npm run smoke:living-frame-temporal-mask-private-output-contract-internal-test
```

This private internal test exercises the first byte-producing temporal-mask
artifact contract independently of SAM2 inference. It produces a deterministic
ground-truth speaker-and-contact-object sequence, encodes it as the required
lossless gray8 FFV1 Matroska stream, decodes every frame, verifies exact
lossless replay, measures temporal stability, persists the artifact
create-only, reopens it, and retains three private review frames.

The fixture is ground truth created by the test. It is not model output and
does not claim SAM2 inference.

## Executed contract

The test executes real FFmpeg and FFprobe entrypoints and requires:

- `video/x-matroska`;
- the `ffv1` codec;
- the `gray` pixel format;
- exact 160 × 90 dimensions;
- exactly 48 frames at 24 FPS;
- byte-for-byte equality between every source mask frame and every decoded
  output frame;
- no finding from the existing temporal-mask measurement profile;
- a minimum adjacent-frame intersection-over-union above 0.9;
- create-only private persistence and exact reopen; and
- no artifact bytes, paths, URLs, credentials, customer pricing, or runtime
  authority in the receipt.

The contact object is deliberately part of the mask silhouette. This proves
that the downstream byte and measurement path can preserve such a shape; it
does not prove that a model will identify the correct contact object.

## Remaining gate

This closes the temporal-mask output encoding, decode, measurement,
persistence, and private-review-frame path. It does not close inference.

Advanced Living A-Roll still requires:

1. the canonical work graph to preserve
   `temporal_subject_mask_sequence` as a distinct SAM2 operation instead of
   compiling it as a still `rembg` PNG;
2. the approved SAM2 checkpoint;
3. the pinned GPU runtime and exact config/checkpoint load;
4. real model inference; and
5. mask edge, subject coverage, contact-object, and temporal-stability QA on
   that model output.

Customer billing, public delivery, and production authority remain false.
