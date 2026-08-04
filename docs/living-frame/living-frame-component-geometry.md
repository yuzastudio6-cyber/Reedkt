# Living Frame Component Geometry

## Status

This slice compiles subject-agnostic component geometry for Living Frame. It
is controlled, non-promotable, and server-only. It is not a layout planner,
mask or depth-evidence authority, renderer, work graph, asset manifest, or
runtime.

## Purpose

A selective-motion scene needs more than motion curves. It must also know:

- which component a curve controls;
- where that component begins inside the confirmed output frame;
- which pivot and anchor it uses;
- whether it sits behind, on, or in front of the subject plane;
- which component owns it;
- which protected regions it must avoid; and
- which static or future depth relationship it expects.

The compiler represents those facts with normalized rectangles and points.
No subject name, story category, provider, tool, file path, prompt, or media
payload is accepted. The same contract can describe an illustrated character,
machine, product, archive, map, scientific diagram, foreground object,
speaker, or any future Living Frame subject.

## Input bindings

The compiler requires:

- a confirmed-output-frame expectation and digest;
- a valid deterministic-motion bundle whose output-frame lineage matches;
- safe regions backed by controlled expectation references;
- visual components plus an optional virtual camera component; and
- bounded occlusion expectations.

The compiler does not prove that those expectations are current. It keeps
output-frame, safe-region, alpha, mask, depth, and timing revalidation gates
open for the canonical server integration.

## Structural rules

- IDs and explicit orders are unique and bounded.
- Component parent and anchor references must exist and form an acyclic graph.
- Exactly one visual component is the focal primary.
- Every component referenced by a motion track must exist.
- Visual rectangles remain within the normalized output frame.
- Pivots and anchors use normalized local coordinates.
- Base footage and plates may cover protected regions.
- Overlay components must avoid protected regions unless a foreground
  occluder is explicitly limited to contact-object overlap.
- Alpha, transparency, and mask expectations must form an allowed tuple.
- Static occlusion must agree with the declared depth bands.
- Static occlusion graphs must be acyclic.
- A depth-transition expectation remains unresolved and explicitly requires a
  later canonical renderer-depth compilation.

## Deterministic output

The compiler derives:

- stable within-band depth order;
- depth rank;
- motion-track links per component;
- protected-region intersections;
- unresolved depth-transition count; and
- a canonical SHA-256 digest.

The output contains relative geometry only. It does not mint current output
frame truth, renderer layer IDs, work items, asset IDs, timing, sound cues,
provider or tool routes, estimates, approvals, or runtime state.

## Renderer boundary

Remotion remains ReeditPro's final deterministic compositor. A later
canonical adapter must:

1. reload the approved snapshot;
2. revalidate the confirmed output frame and MasterTiming lineage;
3. revalidate current masks, alpha artifacts, safe regions, and source
   evidence;
4. map the relative component order into the existing renderer plan;
5. preserve captions above the appropriate visual layers; and
6. keep provider, worker, asset-manifest, QA, and review lineage attached.

This source slice does not perform that projection.

## Authority boundary

Output-frame, layout-planning, depth-evidence, mask-evidence, alpha-QA,
MasterTiming, exact-frame, SoundSync, estimate, cost, approval, snapshot,
provider, tool-route, work-graph, queue, asset-manifest, renderer,
render-execution, runtime-promotion, and production authority all remain
literal false.
