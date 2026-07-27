# Living Frame Render Projection

## Status

This contract is a controlled, non-executable projection candidate for the
existing canonical Remotion planner. It is not a second renderer,
`RendererCompositionPlan`, approved layer manifest, work graph, or render
command.

## Purpose

The preceding Living Frame slices establish:

- exact but non-authoritative motion samples;
- normalized component geometry, pivots, anchors, depth, and safe regions;
- alpha and temporal-mask evidence;
- visual-continuity measurements; and
- a controlled scene evidence package.

This projection assembles those values into renderer-facing component records.
For each visual component it carries:

- relative render order;
- opaque, RGBA, temporally masked, procedural, or additive primitive kind;
- artifact and mask references;
- normalized rectangle, pivot, and anchor;
- depth band and relative depth;
- component-scoped motion tracks and samples; and
- protected-region intersections.

A separate camera projection carries camera-role motion tracks. No subject,
story category, provider, tool, or example-specific route is encoded.

## Admission rules

The compiler independently revalidates the motion, geometry, and scene
evidence package digests and their exact lineage.

It rejects:

- packages blocked by alpha, mask, decontamination, or continuity findings;
- missing or duplicate artifact/component bindings;
- camera tracks attached to visual layers;
- non-camera tracks attached to a virtual camera;
- multiple virtual cameras;
- broken output-frame or scene lineage;
- inconsistent artifact/mask primitive mappings; and
- forged authority or unknown output fields.

Procedural, additive, and depth-transition expectations may be represented in
a blocked projection candidate so the future canonical adapter knows what
must be resolved. They do not become renderer capabilities by being listed.

## Existing renderer boundary

The future canonical adapter must extend the existing
`createRendererCompositionPlan` path. It must:

1. reload the immutable approved snapshot and current scene evidence;
2. revalidate MasterTiming and confirmed output-frame lineage;
3. link every projected artifact to the existing asset manifest;
4. assign canonical renderer-layer IDs and z-indices;
5. preserve captions above required Living Frame layers;
6. map the typed tracks to qualified Remotion primitives;
7. run the existing artifact and edit QA gates; and
8. use the existing private Remotion review/revision path.

This compiler does none of those authoritative operations.

## Authority boundary

Renderer-plan, renderer-layer-ID, asset-manifest, artifact-QA, caption,
MasterTiming, exact-frame, SoundSync, estimate, cost, approval, snapshot,
provider, tool-route, work-graph, queue, Remotion-execution, private-review,
runtime-promotion, and production authority remain literal false.
