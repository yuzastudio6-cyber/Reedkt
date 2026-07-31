# Living Frame Blender Fixed Adapter Private Internal Test

Status date: 2026-07-30

Status:
`passed_private_native_host_partial_qualification`

This document records one bounded, real Blender qualification for Living
Frame rigging. It is private internal evidence only. It does not register a
tool or operation, admit work, persist a canonical asset, approve QA, charge a
customer, deliver a public artifact, or grant production authority.

## Why this runtime exists

Most Living Frame motion should remain in the lighter native Remotion path.
Blender is reserved for an approved component that actually requires
armatures, skin weights, inverse kinematics, joint constraints, or a component
depth pass.

The Head Intelligence never writes Blender code. It chooses a typed,
non-executable rigging direction. Deterministic compilers validate the rig and
action, and a fixed reviewed adapter performs the bounded Blender work:

```text
Head Intelligence Rigging Direction
  -> Rigging v2 relational validation
  -> MasterTiming-bound Rig Action Plan
  -> fixed server-owned Blender request
  -> reviewed no-argument bpy adapter
  -> transparent RGBA + mask + depth component sequences
  -> later canonical persistence, QA, and review
  -> Remotion final canvas
```

## New contracts

`living-frame-rig-action-plan-v1` closes a critical gap between rig definition
and animation. A rig identifies bones, controls, constraints, meshes, and IK
chains; it does not say which pose should occur at which frame. The Rig Action
Plan binds exact control or bone tracks to the existing MasterTiming-derived
rig range. It allows one primary action, optional secondary tracks, explicit
interpolation, and an approved final-pose policy.

The Blender request then binds:

- the exact verified Rigging v2 plan and candidate request;
- the exact Rig Action Plan and its digest;
- one approved rigged component;
- one bounded triangular mesh;
- exact UVs and one-to-four normalized skin weights per vertex;
- exact bones, hierarchy, joint limits, IK target, and solver limits;
- confirmed output dimensions and frame range;
- one approved full or blocking-preview render profile;
- RGBA, mask, and depth output requirements; and
- the complete no-authority boundary.

The adapter rejects raw chat, code, commands, caller paths, URLs, model or
plugin choices, credentials, and environment input. It starts Blender with
factory settings and auto-execution disabled. It writes into a private,
create-only temporary root and returns only validated output plus digest,
count, byte, timing, and memory evidence.

## Qualified Blender package

The bounded native-host test used:

| Property | Observed value |
| --- | --- |
| Blender | `4.5.11 LTS` |
| Build hash | `4db51e9d1e1e` |
| Platform | macOS ARM64 |
| Package SHA-256 | `1fad76c7da9451c7d6db99f1a5ed3c0a1a461d0aa07bf2b639e2fb4804ca4f13` |
| Signature | `Developer ID Application: Stichting Blender Foundation (68UA947AUU)` |
| Gatekeeper | notarized and accepted |
| Execution | background, factory startup, auto-execution disabled |

This proves one signed native-host package and one reviewed adapter. It is not
evidence for a released Linux worker image, non-root container, zero-network
confinement, or canonical distributed runtime.

## Real fixture

The qualification fixture is an exact 1920×1080 component render covering
frames 12 through 71 at 30 FPS:

- 256 mesh vertices;
- 450 non-degenerate triangles;
- two deform bones;
- two bounded joints;
- one IK chain and one typed IK action;
- full per-vertex normalized skin weights;
- opaque component material over a transparent film;
- RGBA PNG output;
- gray mask PNG output; and
- 32-bit OpenEXR depth output.

The action moves from its approved initial pose, reaches a distinct
demonstration pose, and returns to the exact initial pose on the final frame.
The first and demonstration RGBA pixel digests differ. The first and final
decoded RGBA pixel digests match exactly.

## Measured representative run

The current measured representative run produced:

| Measurement | Result |
| --- | --- |
| Cold startup | 899 ms |
| Warm startup | 120 ms |
| Cold-start maximum resident memory | 119,062,528 bytes |
| Blocking preview | 480×270, 10 sampled frames |
| Preview total / render | 3,583 ms / 2,645 ms |
| Preview maximum resident memory | 331,251,712 bytes |
| Full render | 1920×1080, 60 frames |
| Rig compile | 66 ms |
| Full total / render | 34,500 ms / 33,593 ms |
| Full maximum resident memory | 636,846,080 bytes |
| RGBA bytes | 47,596,719 |
| Mask bytes | 1,354,295 |
| Depth bytes | 1,137,483 |

The preview uses the same approved frame range but samples every sixth frame.
The full render uses every frame. The profile is server-selected: arbitrary
preview scales and frame steps are rejected.

These measurements show why Blender can be reasonable when used selectively:
the blocking preview is a few seconds, the one-second full component sequence
is roughly half a minute on this host, and the normal native motion route
avoids Blender entirely. They are measurements of one bounded fixture, not a
universal performance promise.

## QA proved

The real test proves:

- exact output frame count;
- exact confirmed canvas dimensions;
- RGBA decoding with both transparent and opaque pixels;
- gray mask output;
- OpenEXR depth output;
- meaningful motion between initial and demonstration frames;
- exact final-pose restoration;
- identical decoded RGBA and mask sequences across a repeated blocking preview
  request;
- no background plate in the component output;
- no final-canvas claim;
- fixed package and adapter identity;
- deterministic request compilation and lineage;
- strict mesh, skin-weight, component, timing, and envelope rejection; and
- all runtime, persistence, cost, billing, public, and production authorities
  remain false.

## OpenToonz disposition

The official OpenToonz 1.8.0 macOS package was also inspected:

| Property | Observed value |
| --- | --- |
| Package SHA-256 | `6360efbde7739910d4eefe9d494b6b57e852a3f75bdbeb1e6d75abb84e609d13` |
| Package signature | absent |
| Included executable architecture | x86_64 |
| Current ARM64 host execution | unavailable without Rosetta |

That package is fail-closed. OpenToonz remains an evaluation candidate for
flat Plastic mesh deformation, not an admitted runtime. Living Frame must use
the native route, the qualified Blender route after its own remaining gates,
or an approved simpler fallback rather than pretending OpenToonz is ready.

## Remaining gates

Before Blender becomes a canonical private worker operation, the following
remain required:

- pinned offline non-root worker image and complete scan/license disposition;
- demonstrated zero-network confinement;
- canonical work-item admission and idempotent worker reconciliation;
- independent rig, deformation, alpha, mask, depth, temporal, and destination
  QA;
- resource/cost receipt;
- private review and fallback evidence;
- broader character, object, topology, and failure fixtures; and
- one-writer backend reconciliation.

OpenToonz separately requires a supported, signed/scanned, reproducible runtime
or must remain evaluation-only.

Customer billing, public delivery, deployment, and production release are not
part of this internal milestone.

The follow-on selected-scene internal milestone now proves exact approved
snapshot, selected Musashi scene, confirmed-frame, MasterTiming, and planned
work lineage; a process-bound single-use adapter output lease; the complete
60-frame RGBA/mask/depth sequence; create-only private persistence; exact
reread; a second single-use persisted-artifact lease; independent sampled
alpha/mask/depth and rig-motion QA; a third single-use RGBA-sequence lease;
four real bounded Remotion compositions; exact 60-frame FFmpeg packaging; and
create-only private review persistence/reread. It deliberately does not mutate
the canonical asset manifest or grant canonical QA, review, cost, dispatch, or
production authority. See
`docs/living-frame/living-frame-blender-selected-scene-private-persistence-internal-test.md`
and
`docs/living-frame/living-frame-blender-selected-scene-private-review-internal-test.md`.

## Regression

```text
npm run smoke:living-frame-rig-action
npm run smoke:living-frame-blender-fixed-adapter-private-internal-test
npm run smoke:living-frame-blender-selected-scene-private-persistence-internal-test
npm run smoke:living-frame-blender-selected-scene-private-review-internal-test
```

The aggregate private Living Frame audit includes this real runtime case but
must remain blocked on the two GPU model runtimes and the remaining canonical
rigging admission gates.
