# Living Frame Alpha Edge Decontamination

## Status

This is a deterministic, server-only image-processing primitive. It is not a
provider route, Production Tool identity, worker, job, queue, asset manifest,
QA approval, renderer, or production runtime.

The primitive is intentionally unregistered. A future canonical work item may
invoke it only after the existing plan, estimate, user approval, immutable
snapshot, dependency, private-artifact, and idempotency authorities admit that
work. Merely importing or successfully running the function does not satisfy
those gates.

## Why Living Frame needs it

An image may have a real alpha channel and still show a white, black, or
colored fringe when composited over the speaker. That happens when
semi-transparent edge RGB values still contain the source matte color.
Background removal alone therefore does not prove a component is ready for
Living A-Roll.

The `srgb8_known_matte_unmix_v1` profile accepts an RGBA artifact with a known
source matte and reconstructs straight-alpha foreground RGB for
semi-transparent pixels:

```text
foreground = (observed - matte * (1 - alpha)) / alpha
```

It preserves the alpha byte, preserves opaque RGB, clears hidden RGB under
fully transparent pixels, clamps recovered channels to 8-bit range, and
returns a new RGBA byte array plus a digest-bound processing report.

## Input and output boundary

Input is an in-process server-owned byte array with:

- a safe artifact identity and lineage digest;
- bounded width, height, and pixel count;
- exact RGBA byte length;
- the closed
  `straight_alpha_with_known_matte_contamination` input mode; and
- a three-channel 8-bit source matte.

Unknown keys, URLs, invalid digests, invalid mattes, wrong byte lengths, and
shared concurrently mutable buffers are rejected. The report records measured
input and output byte digests, but does not contain pixels, paths, URLs, or
credentials. The processing result returns output pixels to its in-process
caller; the report itself does not.

## Report observations

The report includes:

- transparent, semitransparent, opaque, low-alpha, and changed pixel counts;
- transparent-RGB cleanup count;
- clamped-channel count and ratio;
- maximum and mean RGB change; and
- closed observation codes for absent semitransparent edges, low-alpha
  recovery, transparent-RGB cleanup, and channel clamping.

These are processing observations, not pass/fail QA decisions. The existing
canonical artifact-QA authority must later combine this report with the alpha
measurement report, multi-background composites, destination-scene composite,
continuity checks, and the approved fallback policy.

## Accuracy limits

The first profile is a controlled 8-bit sRGB approximation. It assumes the
provided matte is the one mixed into the edge and the alpha estimate is
meaningful. Low alpha amplifies small RGB errors; clamping is recorded rather
than hidden. The primitive does not:

- estimate or refine alpha;
- infer the source matte;
- reconstruct missing foreground detail;
- verify hair, fabric, sword, face, hand, or identity edges;
- validate a destination composite;
- qualify a segmentation or matting model;
- choose a fallback; or
- promote an artifact into rendering.

More advanced linear-light or learned foreground-color estimation requires a
separately qualified profile and may not silently replace this one.

## Authority boundary

The report keeps artifact QA, planning, timing, SoundSync, estimate, cost,
approval, snapshot, provider, tool-route, work-graph, queue, asset-manifest,
render, runtime-promotion, and production authority literal false.
