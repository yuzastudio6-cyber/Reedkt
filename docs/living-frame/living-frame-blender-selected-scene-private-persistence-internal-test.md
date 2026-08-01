# Living Frame Blender selected-scene private persistence internal test

Status: private internal evidence; canonical work, manifest, QA, review, cost,
public delivery, and production authority remain closed.

## Purpose

This milestone connects the fixed reviewed Blender rig adapter to one real
Living Frame scene rather than only an isolated rig fixture. It proves that a
selected 2.5D character component can be bound to the existing selected-scene,
approved-snapshot, confirmed-frame, MasterTiming, planned-work, rigging, and
rig-action lineage before any bytes are rendered or persisted.

The tested scene is:

| Binding | Value |
| --- | --- |
| Living Frame scene | `scene.musashi-strike` |
| Animated component | `musashi.body` |
| Component role | `primary_subject` |
| Rig mode | `armature_2_5d_character` |
| Confirmed output frame | 1920×1080 |
| MasterTiming visual range | frames 12 through 71 |
| Frame rate | 30 FPS |
| Planned operation candidate | `tool.blender.render_living_frame_component_rig.v1` |

The operation remains a candidate. This milestone does not register it,
dispatch canonical work, mutate the canonical asset manifest, approve QA,
create an actual canonical cost event, or grant customer/public/production
authority.

## Execution boundary

The Head Intelligence and Living Frame planners produce typed, non-executable
direction:

```text
selected scene
-> component_rigging activation
-> living-frame-rigging-plan-v2
-> living-frame-rig-action-plan-v1
-> selected-scene Blender admission candidate
-> fixed reviewed bpy adapter
```

The adapter accepts no raw chat, prompt, code, command, path, URL, model
selection, environment, credential, or arbitrary Blender graph. Blender
receives only the fixed adapter plus the exact typed rig/action payload.
Remotion remains the final-canvas owner.

## Exact output and persistence

The full admitted visual range produced:

| Artifact class | Count |
| --- | ---: |
| Transparent RGBA PNG | 60 |
| Gray mask PNG | 60 |
| OpenEXR depth | 60 |
| Total | 180 |

The adapter output is exposed only through a process-bound single-use lease.
The persistence bridge:

- revalidates the selected-scene admission and every lineage digest;
- requires the complete MasterTiming visual range for all three passes;
- rejects blocking-preview output as a final selected-scene artifact set;
- derives every private relative path on the server;
- uses create-only private writes;
- rereads every file and verifies byte length, SHA-256, and PNG/OpenEXR
  signature;
- writes and rereads one digest-bound private manifest;
- returns only byte-free commitments and a second process-bound single-use
  artifact-set lease; and
- cleans the adapter's temporary output tree.

No local path, raw artifact byte, URL, credential, command, environment, or
executable payload appears in the serializable report.

## Measured run

The current bounded selected-scene run observed:

| Measurement | Value |
| --- | ---: |
| Full render and adapter duration | 35,298 ms |
| Maximum resident memory | 604,389,376 bytes |
| Persisted artifact bytes | 38,524,150 |
| Persisted files | 180 |

This is one native ARM64 internal fixture. It is useful performance evidence,
not a universal latency or production-capacity promise.

## Adversarial coverage

The smoke test rejects:

- confirmed-frame square substitution;
- forged admission digest;
- cross-scene substitution;
- forged planned-work digest;
- raw path/prompt fields hidden inside approved snapshot or work bindings;
- a broad or non-owned persistence root;
- replay of the consumed adapter output lease; and
- replay of the consumed persisted artifact-set lease or any opened artifact
  stream.

The admission compiler also fails closed on missing component-rigging
activation, component/scene mismatch, invalid rig candidates, invalid rig
actions, stale MasterTiming or confirmed-frame lineage, and authority
promotion.

## Remaining gates

The internal chain still requires canonical-owner reconciliation for:

- the Blender tool profile and operation registration;
- estimate, work-graph, and asset-manifest projection;
- a pinned offline non-root, zero-network worker image;
- canonical work admission and idempotent worker execution;
- canonical rig, deformation, alpha, mask, depth, temporal, and destination QA
  approval;
- canonical reconciliation of the now-passing private component QA and
  Remotion review evidence;
- canonical resource and actual tool-cost receipts; and
- broader character, topology, mechanical-object, and failure fixtures.

Customer billing, public delivery, deployment, and production release remain
out of scope.

## Regression

```text
npm run smoke:living-frame-blender-selected-scene-private-persistence-internal-test
npm run smoke:living-frame-blender-selected-scene-private-review-internal-test
npm run smoke:living-frame-private-internal-end-to-end-audit
```

The next measured stage is documented in
`docs/living-frame/living-frame-blender-selected-scene-private-review-internal-test.md`.
