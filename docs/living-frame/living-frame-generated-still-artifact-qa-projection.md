# Living Frame Generated-Still Artifact/QA Projection

Status: controlled, non-promotable, and non-executable

Contract:
`living-frame-generated-still-artifact-qa-projection-v1`

## Purpose

This projection closes the design gap between the verified Living Frame
generated-still alpha bridge and ReeditPro's existing canonical artifact
pipeline. It does not persist an artifact or approve it. It fixes the exact
inputs and existing authorities the canonical worker must reuse.

The projected dependency order is:

1. `living_frame_generated_opaque_still_png`;
2. `living_frame_alpha_mask_png`; and
3. `living_frame_component_rgba_png` produced by the existing Sharp operation.

The generated opaque still is never relabeled as a source-video frame.

## Canonical execution target

The only accepted compositor-preparation operation is:

```text
tool: sharp
operation: tool.sharp.prepare_approved_image_asset.v1
recipe: approved_living_frame_alpha_component_v1
runner: offline_sharp_structured_execution_v1
output: living_frame_component_rgba_png
alpha: straight
```

The canonical worker must independently reread the approved snapshot, work
item, both dependency artifacts, the worker lease, and the dispatch grant. The
projection cannot supply or replace those authorities.

## QA behavior

The measured alpha must contain real variation and no blocking alpha finding.
The controlled bridge currently measures black, white, mid-gray, and saturated
red composites. Destination-scene compositing remains a later canonical QA and
private-review requirement because the destination frame is intentionally not
available to the component-preparation stage.

Artifact recording must reuse:

- canonical worker lease authority;
- canonical private image artifact storage;
- canonical private artifact QA authority;
- canonical asset-manifest reconciliation; and
- canonical private review.

No Living Frame-specific timing, worker, credit, approval, QA, asset-manifest,
or renderer authority is introduced.

## Remaining shared integration

The existing canonical Sharp service currently admits only
`approved_exact_source_frame_png` as its alpha source. A later reviewed shared
change must add a strict discriminated generated-still source variant while
preserving the source-frame branch byte-for-byte. The existing artifact-QA and
reconciliation services remain the only authorities.

The projection also leaves generated-still work-item creation, canonical
ComfyUI operation registration, source/mask artifact persistence, destination
composite QA, continuity and documentary-safety review, and final Remotion
consumption closed.
