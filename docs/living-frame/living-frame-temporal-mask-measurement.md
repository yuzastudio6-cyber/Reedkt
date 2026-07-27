# Living Frame Temporal Mask Measurement

## Status

This is a bounded server-side measurement primitive for consecutive alpha-mask
frames. It is not a timing authority, QA gate, fallback decision, worker,
queue, artifact manifest, renderer, model qualification, or production
runtime.

## Purpose

Living A-Roll can place explanatory components behind and in front of a
speaker only when the subject mask remains stable over time. A single clean
frame does not prove that the mask will avoid flicker, crawling edges, sudden
coverage changes, or large centroid jumps.

The fixed `contiguous_mask_sequence_measurement_v1` profile measures:

- weighted and thresholded mask coverage per frame;
- weighted normalized centroid per frame;
- empty, full-frame, and all-edge-touching masks;
- pairwise coverage change;
- pairwise normalized centroid shift;
- binary intersection over union;
- changed-pixel and mean alpha-delta ratios; and
- one-pixel-tolerant boundary disagreement.

It aggregates maximum and percentile observations and emits closed finding
codes. The thresholds are controlled measurement-profile constants, not
customer settings and not approval policy.

## Input and lineage boundary

The primitive accepts only server-owned contiguous alpha byte arrays with
bounded dimensions, frame count, total bytes, safe artifact identities, and
artifact digests. It rejects gaps, duplicates, reordering, wrong byte lengths,
shared concurrently mutable buffers, URLs, and paths.

The report includes each artifact identity, a digest of each measured alpha
array, a digest of the ordered frame set, bounded metrics, and no raw mask
bytes. Input shapes reject unknown keys and duplicate artifact identities.
Report verification binds ordered artifact, frame, and pair indices and
recomputes aggregates and closed findings. Canonical integration must still
independently re-read the artifacts and bind those frames to the
approved snapshot, exact work items, asset-manifest versions, and the existing
MasterTimingPlan. Frame indices inside this report do not create timing
authority.

## Authority boundary

Every report keeps literal false for planning, timing, SoundSync, estimate,
cost, approval, snapshot, QA, fallback, provider, tool route, work graph,
queue, render, runtime-promotion, and production authority.

Canonical artifact QA may later consume the measurements and decide:

- accept the mask for the approved depth composition;
- retry or refine within the approved fallback policy;
- downgrade to a safe-space overlay, lower stage, side-by-side, or full visual
  scene; or
- block final render and request review.

The measurement primitive itself makes none of those decisions.

## Limitations

The first profile:

- requires a bounded contiguous in-memory window;
- measures alpha stability, not source-video alignment;
- does not verify faces, hands, hair, contact objects, or identity;
- does not detect whether the mask lags optical motion;
- does not qualify SAM 2, BiRefNet, rembg, or any checkpoint;
- does not inspect motion blur or destination composites; and
- does not authorize advanced Living A-Roll.

Production use requires current source evidence, model-artifact qualification,
privacy and retention gates, actual mask-sequence artifacts, destination
composite QA, canonical fallback policy, and private review.
