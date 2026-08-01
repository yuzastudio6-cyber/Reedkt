# Living Frame Selected-Scene Motion Style Reconciliation

## Status

This is a namespaced, server-derived, read-only reconciliation candidate.
It does not register an operation, dispatch work, mutate a motion spec, alter
an approved Visual Continuity Pack, authorize rendering, persist an artifact,
approve QA, create cost, charge a customer, or promote production.

## Why this boundary exists

Living Frame is not a universal 2.5D treatment. The approved Visual
Continuity Pack can direct one of four distinct scene-depth languages:

- `flat`;
- `shallow_2_5d`;
- `deep_multiplane`; or
- `dimensional`.

The current canonical motion compiler supports only:

- `flat`;
- `shallow_2_5d`; and
- `deep_multiplane`.

It currently derives that value from selected component metadata and motion
signals. It does not consume the exact approved scene-design depth from the
Visual Continuity Pack. That creates a shared-interface conflict:

- an approved flat scene can be inferred as deep multiplane;
- an approved shallow-2.5D scene can be inferred as deep multiplane; and
- an approved dimensional scene cannot be expressed by the current canonical
  motion enum or renderer contract.

Silently accepting any of those results would change the approved visual
language after planning. Silently converting `dimensional` to a 2.5D style
would also collapse two intentionally separate design decisions.

## Contract

`living-frame-selected-scene-motion-style-reconciliation-v1` consumes:

1. the verified selected-scene private conditioning binding;
2. the exact inputs used to create that binding; and
3. one current canonical motion spec for every approved generated component.

The reconciler:

- re-verifies the private conditioning binding;
- revalidates selected-scene, approved-snapshot, MasterTiming, Visual
  Continuity Pack, work-item, planned-asset, scene, component, and output
  lineage;
- independently recompiles each canonical motion spec from its canonical
  selected-scene and timing inputs;
- compares the approved depth language with the observed canonical motion
  depth;
- emits only digest/count/lineage observations; and
- never changes either side of the comparison.

One reconciliation unit exists per exact approved generated output intent.
Duplicate, missing, extra, forged, cross-scene, cross-component, and
cross-profile motion inputs fail closed.

## Decisions

| Approved scene depth | Current canonical observation | Result |
| --- | --- | --- |
| `flat` | `flat` | Exact supported match |
| `shallow_2_5d` | `shallow_2_5d` | Exact supported match |
| `deep_multiplane` | `deep_multiplane` | Exact supported match |
| Any supported depth | Different supported depth | Block canonical motion admission for that unit |
| `dimensional` | Any current canonical depth | Block as unsupported by the current motion/renderer runtime |

An exact match is evidence only. This candidate grants no work-graph,
renderer, dispatch, runtime, private-review, approval, or production
authority.

A mismatch can be resolved only by one of these canonical-owner actions:

1. bind the exact approved scene-design depth into the canonical motion
   compiler and renderer;
2. implement and qualify an explicit dimensional motion/renderer contract; or
3. create a new approved plan version that explicitly downgrades the depth
   treatment.

Reconciliation itself cannot perform a downgrade.

## Motion preparation relationship

The selected-scene private conditioning binding already compiles the approved
depth into one of:

- `flat_layer_animation`;
- `shallow_2_5d_parallax`;
- `deep_multiplane_parallax`; or
- `dimensional_spatial_composition`.

Only shallow and deep-multiplane preparations are 2.5D-directed. Flat scenes
must not receive parallax, fake extrusion, or perspective-camera staging.
Dimensional scenes must not be relabeled as 2.5D.

## Ownership

The following owners remain unchanged:

- Visual Continuity Pack and scene design own approved visual style;
- selected-scene admission owns the selected scene;
- MasterTiming owns exact frames;
- the canonical motion compiler owns executable motion specs;
- the canonical work graph owns motion admission;
- Remotion owns the final canvas;
- canonical private review owns review evidence;
- the existing estimate, actual-cost, billing, and approval systems retain
  their authority.

This contract exists only to expose divergence before it becomes an
unapproved render.

## Validation

`server/smoke/living-frame-selected-scene-motion-style-reconciliation-smoke.ts`
proves:

- exact deep-multiplane reconciliation;
- fail-closed flat-to-deep divergence;
- fail-closed shallow-to-deep divergence;
- fail-closed dimensional runtime absence;
- duplicate motion-spec rejection;
- recomputed canonical motion-spec integrity;
- cross-profile substitution rejection; and
- authority-forgery rejection.
