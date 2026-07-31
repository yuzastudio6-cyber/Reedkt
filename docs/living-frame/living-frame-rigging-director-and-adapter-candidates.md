# Living Frame Rigging Director and Fixed Adapter Candidates

Status date: 2026-07-30

Status:
`verified_source_contract_blender_private_native_host_partial_qualification`

This document defines the professional rigging decision and fixed-adapter
boundary for Living Frame. One fixed Blender adapter now has bounded private
native-host runtime evidence. This does not register Blender or OpenToonz,
dispatch a canonical worker, persist a canonical asset, approve QA, change
cost, or grant production authority.

## Product requirement

Living Frame cannot treat rigging as a generic effect or ask a model to invent
arbitrary executable code. The Head Intelligence must decide why motion is
needed, which components carry the meaning, what must remain still, and which
rigging route is professionally sufficient.

The controlled flow is:

```text
compiled intent + visual evidence + semantic scene
  -> Head Intelligence Rigging Direction
  -> deterministic Rigging v2 validation
  -> native or external candidate routing
  -> fixed reviewed adapter candidate
  -> later canonical snapshot/work/lease/runtime admission
  -> transparent component output
  -> Remotion final composition
```

The Head Intelligence produces structured data only. It never supplies Python,
JavaScript, a shell command, command-line arguments, paths, URLs, environment
variables, credentials, plugin names, or arbitrary tool nodes to a rigging
worker.

## Head Intelligence ownership

`living-frame-rigging-direction-v1` binds:

- the exact geometry, motion, component-rig, output-frame, and MasterTiming
  lineage;
- the compiled intent and semantic scene;
- the reasoning attempt, schema-validated output, and visual-understanding
  evidence;
- narrative purpose and visual verb;
- one primary focal component;
- importance and attention priority;
- the five semantic phases
  `prepare -> activate -> demonstrate -> resolve -> settle`;
- required capabilities;
- selected native or evaluation backend;
- part-decomposition, skeletal-deformation, IK, depth-camera, and transparent
  output decisions;
- craft, risk, manual-review, performance, cache, and fallback expectations.

The current Head Intelligence roles remain provider-neutral:

- Kimi K3 primary;
- Qwen 3.7 fallback; and
- DeepSeek V4 tool/code reasoning fallback.

These roles may propose structured rig direction. They do not receive runtime,
dispatch, timing, asset, renderer, approval, billing, or production authority.
Workers do not receive raw chat.

## Rigging modes

`living-frame-rigging-plan-v2` supports five deliberate modes:

| Mode | Intended use |
| --- | --- |
| `native_rigid_transform` | One or more rigid parts with approved pivots and scalar tracks |
| `native_hierarchical_cutout` | Parent/child cutout parts and bounded secondary motion |
| `mechanical_linkage` | Driver/follower parts with exact pivots, ratios, and phase offsets |
| `deformable_2d_character` | Flat triangular-mesh deformation with a skeleton, angle limits, rigidity, and stacking |
| `armature_2_5d_character` | Advanced armature, joints, controls, IK, skin weights, deformation, and depth-camera output |

The plan represents:

- part proposals and confidence;
- manual review and hidden-area reconstruction requirements;
- bones and acyclic hierarchy;
- measured rest lengths;
- joints and rotation limits;
- root, transform, IK, pole, and mechanical controls;
- constraints;
- IK chains and solver limits;
- triangular or 2.5D skinned meshes;
- topology, weight, and rigidity artifact references;
- stacking order;
- mechanical linkages;
- secondary-motion groups;
- output passes;
- QA; and
- fallback order.

The compiler and verifier reject incomplete part coverage, unsafe low-confidence
automation, cyclic or missing bones, incorrect rest lengths, invalid joints,
missing controls, invalid constraints, broken IK ancestry, invalid mesh/weight
bindings, zero-ratio linkages, bad follower groups, mode/backend mismatch,
runtime promotion, and final-canvas claims. The verifier repeats relational
checks after digest validation so a malformed artifact does not become valid
merely because its digest was recomputed.

Rig definition is intentionally separate from rig action.
`living-frame-rig-action-plan-v1` binds exact control, bone, or mechanical
action keyframes to the MasterTiming-derived rig range. It requires one primary
action, ordered values, valid targets, and an explicit final-pose policy. This
prevents Blender, OpenToonz, or a worker from inventing poses or timing merely
because a rig exists.

## Professional route selection

The Head Intelligence must consider the simplest route that can deliver the
approved result professionally:

| Requirement | Route |
| --- | --- |
| Rigid parts, hierarchy, pivots, scalar motion | ReeditPro native + Remotion |
| Wheels, rotors, gears, rods, driver/follower mechanics | ReeditPro native + Remotion |
| Flat illustrated character requiring smooth mesh bending | OpenToonz Plastic evaluation candidate |
| Bones, skin weights, IK, advanced constraints, 2.5D camera/depth | Blender headless evaluation candidate |

Blender is not selected merely because it is powerful. OpenToonz is not
selected merely because the source is illustrated. If the native route is
professionally sufficient, it remains preferred.

## Fixed adapter boundary

`living-frame-rigging-adapter-candidate-v1` proves the intended automation
boundary:

```text
Head AI typed plan
  -> strict schema and relational validation
  -> server-derived fixed adapter selection
  -> reviewed adapter implementation
  -> private component render
```

The Blender candidate operation name is:

```text
tool.blender.render_living_frame_component_rig.v1
```

Its intended adapter is a fixed, reviewed `bpy` implementation. The model never
writes or selects the Python script.

The OpenToonz candidate operation name is:

```text
tool.opentoonz.render_living_frame_plastic_component_rig.v1
```

Its intended adapter is a fixed, reviewed scene/materialization and batch-render
implementation. The model never writes a ToonzScript or chooses a command.

These names are candidates only. They are not operation registrations or
canonical tool identities. The current shared tool registry is not mutated by
this slice.

## Performance policy

No latency claim is allowed without measured evidence. External candidates must
run scene-only, render a low-resolution blocking preview first, and use the
exact rig digest as a cache key. An unrelated caption or audio revision must not
invalidate a reusable rig.

Qualification must measure:

- cold start;
- warm start;
- rig compilation;
- blocking preview render;
- full-quality component render;
- peak memory;
- output bytes; and
- exact cache reuse.

This is how the system can use a large application such as Blender without
making every Living Frame scene heavy: native motion remains the normal path,
and an external runtime is reserved for an approved rig that actually needs
it.

## Tool knowledge and qualification gates

The Blender knowledge profile covers:

- background/headless execution;
- Python API armature creation;
- bone constraints and IK;
- mesh skinning and weights; and
- transparent component plus depth-pass rendering.

The OpenToonz knowledge profile covers:

- Plastic triangular meshes;
- skeleton vertices and angle bounds;
- rigidity and stacking;
- fixed scene materialization; and
- batch transparent component rendering.

Before either candidate may execute in a private canonical worker, the
following evidence remains required:

- pinned source and license disposition;
- signed, scanned, non-root, offline runtime image;
- reviewed fixed-adapter source and digest;
- the complete performance measurements;
- transparent output proof;
- part, pivot, joint, skin, mesh, temporal, and deformation QA;
- create-only private persistence and exact reread;
- resource/cost receipt; and
- canonical snapshot, work graph, lease, asset, QA, and private-review
  admission.

If OpenToonz cannot provide a sufficiently controlled and repeatable
scene/materialization path during qualification, it remains evaluation-only.
The approved fallback resolver chooses a simpler treatment or a newly approved
route; the worker does not improvise.

## Current external-runtime qualification

The fixed reviewed Blender `bpy` adapter now passes one bounded native ARM64
private test with Blender 4.5.11 LTS. It builds a two-bone skinned armature,
applies joint limits and IK, renders a 10-sample blocking preview, then renders
all 60 frames at 1920×1080. Independent QA observes transparent RGBA, gray mask,
32-bit OpenEXR depth, meaningful pose change, and exact final-pose restoration.
The representative full run takes about 34.5 seconds and peaks near 637 MB;
the sampled preview takes about 3.6 seconds and peaks near 331 MB.

This is partial qualification only. Zero-network confinement, an offline
non-root worker image, canonical work admission, private persistence/reread,
resource/cost ownership, broader fixtures, and private review remain open.

The inspected OpenToonz 1.8.0 macOS package is unsigned and x86_64-only. It
cannot execute on the current ARM64 host without Rosetta, so it remains
fail-closed and evaluation-only. Details and exact package receipts are in
`docs/living-frame/living-frame-blender-fixed-adapter-private-internal-test.md`.

## Final-canvas and authority boundary

Blender and OpenToonz may produce only approved transparent component layers
and, where explicitly required, depth/mask passes. They never own:

- source-sequence truth;
- selected-scene authority;
- MasterTiming or exact frames;
- approved snapshots;
- the async work graph;
- asset-manifest admission;
- cost or billing;
- QA approval;
- captions or sound;
- final canvas;
- export; or
- public/production release.

Remotion remains the final compositor.

## Source and regression evidence

Public contracts:

- `src/types/living-frame-rigging-direction.ts`
- `src/types/living-frame-rigging-v2.ts`
- `src/types/living-frame-rigging-adapter-candidate.ts`
- `src/types/living-frame-rig-action.ts`
- `src/types/living-frame-blender-fixed-adapter-internal-test.ts`

Server compilers:

- `server/living-frame/living-frame-rigging-direction.ts`
- `server/living-frame/living-frame-rigging-v2.ts`
- `server/living-frame/living-frame-rigging-adapter-candidate.ts`
- `server/living-frame/living-frame-rig-action.ts`
- `server/living-frame/living-frame-blender-fixed-adapter-internal-test.ts`
- `server/living-frame/runtime/living-frame-blender-fixed-adapter.py`

Regression:

```text
npm run smoke:living-frame-rigging-v2
npm run smoke:living-frame-rig-action
npm run smoke:living-frame-blender-fixed-adapter-private-internal-test
```

The regression covers native mechanical, OpenToonz flat-2D, and Blender
advanced-2.5D routing, deterministic replay, fixed-adapter materialization, and
adversarial authority, lineage, code-injection, rig-relationship, route, and
final-canvas substitutions. The private Blender regression additionally
executes the real fixed adapter and measures full-frame RGBA, mask, depth,
timing, action, memory, and performance evidence.
