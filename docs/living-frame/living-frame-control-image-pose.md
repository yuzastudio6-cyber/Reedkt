# Living Frame deterministic pose control image

Status: controlled reference pixel primitive; no pose-detection, artifact,
tool-route, or runtime authority.

## Purpose

Living Frame can now convert an exact bounded COCO-17 landmark packet into an
opaque OpenPose-style RGBA control raster. This supplies deterministic
structure drawing without installing or executing the broad
`comfyui_controlnet_aux` bundle.

The primitive does not detect people or infer landmarks from source pixels.
It consumes an externally derived packet whose dimensions, people, keypoint
order, normalized coordinates, confidences, and complete canonical digest
must match exactly.

## Fixed rasterization

The source contract requires all 17 COCO keypoints in fixed order for each
of at most eight people. A caller-bounded minimum confidence determines
which joints and limbs are visible. The deterministic renderer then:

1. converts normalized coordinates to the nearest output pixel;
2. draws a fixed 16-limb COCO topology;
3. uses integer Bresenham lines with a disc brush;
4. draws visible joints in fixed keypoint order;
5. uses a fixed OpenPose-style color palette; and
6. produces opaque RGBA pixels over black.

Person order, keypoint order, limb order, colors, widths, radii, and
coordinate quantization are fixed. Reordered, duplicate, non-finite,
out-of-frame, stale-digest, or insufficiently visible packets fail closed.

## Privacy and evidence boundary

The report retains no person identifiers, landmark coordinates,
confidences, or pixels. It stores the packet identifier and digest, source
artifact lineage, algorithm profile, output digest, dimensions, and aggregate
counts only. Output pixels are returned out of band.

This source-only contract cannot promote caller landmarks into verified pose
evidence. A future workflow-neutral private evidence reader must bind the
packet to the exact source, frame, tenant, and approved plan before canonical
use.

## Relationship to auxiliary preprocessing

This deterministic primitive removes the need to install a broad auxiliary
bundle merely to draw a pose map from already available landmarks. It does
not qualify:

- a person detector;
- a COCO keypoint or OpenPose estimator;
- any copied annotator source or model checkpoint;
- ControlNet pose-map compatibility;
- a ComfyUI custom node; or
- a GPU/CPU worker profile.

Those remain separately pinned, licensed, benchmarked, and admitted
capabilities. The resulting pixel contract may later be connected to the
existing controlled ControlNet graph only after a specific compatibility
benchmark passes.

## Closed gates

The primitive does not choose pose control semantically, create artifacts or
manifest entries, run models, assign tools, create work, queue jobs, alter
timing, spend credits, approve plans, render scenes, or grant runtime or
production authority. Routing is generic rather than subject-specific.
