# Living Frame character animation route suitability

Status: source contract and private internal fixture evidence. No provider,
worker, operation, billing, public-delivery, or production authority.

## Why this gate exists

A painted character cannot be sent to a rig merely because a foreground
cutout exists. Rigging can move and deform pixels that already exist; it cannot
reliably invent hidden anatomy, rebuild a hand, separate a sleeve from an arm,
or preserve a face when one merged painted layer crosses it.

The rejected Musashi proof demonstrated the failure mode. One merged
arm/sleeve/hand/sword cutout was mapped to a generic rectangular two-bone mesh.
The output passed basic alpha, mask, depth, motion, and restoration checks, but
the painted component bent and crossed the face unnaturally. Pixel motion was
not professional character animation.

`living-frame-character-animation-route-decision-v2` prevents that class of
false positive.

## Professional route policy

| Asset and action evidence | Route |
| --- | --- |
| Rigid cutout, known pivot, reviewed component boundary and exposed source plate, ambient or restrained action, no new pixels required | PixiJS rigid cutout rendered as a component below the Remotion final canvas |
| Rigid cutout whose movement exposes an unreviewed plate or contaminated component edge | Controlled component preparation, then the simplest qualified deterministic route |
| Separated flat parts with reviewed pivots, hidden artwork, and safe mesh topology | OpenToonz Plastic evaluation candidate |
| Separated upper arm, forearm, hand, and prop with reviewed joints, hidden artwork, mesh, and skin weights | Blender articulated 2.5D evaluation candidate |
| Merged painted cutout plus a large pose change or newly revealed anatomy | ComfyUI controlled key poses |
| Continuous natural motion beyond controlled key poses and deterministic rigs | Real Motion fallback |
| Insufficient evidence | Deliberate no-animation decision |

Every accepted character-motion route must also carry a reviewed protected-face
path and attachment-continuity decision. A technically valid pivot or mesh is
rejected when it moves the component across the face improperly or visually
disconnects it from the body.

For the current Musashi artwork:

- restrained whole-character drift routes to the PixiJS rigid-cutout path,
  with Remotion retaining final-canvas ownership;
- the extracted arm/sleeve/hand/sword component does **not** route directly to
  PixiJS because its movement exposes an unreviewed source plate, its extracted
  boundary is not professionally prepared, and the tested path crosses the
  protected face;
- that articulated sword action routes first to controlled component
  preparation and may return to PixiJS only after plate, boundary, path, and
  composite review pass;
- a large new pose routes to controlled ComfyUI key-pose generation; and
- generic Blender deformation is rejected.

This distinction is important: PixiJS can animate a prepared cutout correctly,
but it cannot repair a cutout that contains the wrong pixels or reconstruct the
pixels behind a removed limb. Tool execution and source preparation are
separate quality gates.

## What ComfyUI does

ComfyUI is a supervised workflow host, not a rigging application. For this
route it may coordinate the approved reference image, pose/depth control,
generic IP-Adapter, ControlNet, and optional LoRA inside one controlled
generation attempt.

It should generate a small number of identity-controlled anchor poses, not
every animation frame independently. Independent per-frame generation would
increase flicker, face drift, costume drift, prop drift, and temporal
inconsistency. The approved anchor poses can later be interpolated and
composited under separate continuity, anatomy, alpha, fact-safety, and temporal
QA.

The current ComfyUI operation remains evaluation-only and blocked pending its
released internal runtime evidence. This gate plans the correct route but does
not claim that generation ran.

The adjacent
`living-frame-character-controlled-preparation-v1` contract now proves the
specific correction needed for the rejected component. It binds one exact
confirmed-ratio source-plate reconstruction and one exact 1024-square isolated
component output to approved selected-scene work. Its private materializer
uses `VAEEncodeForInpaint` for the masked plate rather than mislabeling the
existing `EmptyLatentImage` graph as inpainting. It creates single-use private
prompt leases only; real L4 generation and output QA remain open.

## What rigging remains for

Blender and OpenToonz remain useful when the source has appropriate topology:

- separated articulated limbs;
- visible and reviewed pivots;
- reconstructed joint and hidden-surface artwork;
- reviewed mesh topology and skin/rigidity weights;
- bounded motion that does not require inventing new anatomy; and
- exact component output below the Remotion final-canvas layer.

PixiJS is also the preferred lightweight route for many mechanical parts and
editorial elements: wheels, rotors, doors, levers, radar dishes, routes,
particles, masks, filters, and parent-child cutouts. It animates prepared
pixels; it does not invent hidden anatomy or new pose artwork. Remotion remains
the final layout, caption, audio, and export compositor.

The private `living-frame-character-pixijs-internal-runtime-v2` evidence now
executes the real pinned PixiJS `Application.init` entrypoint in a fixed
offline browser container and renders 120 transparent whole-character frames.
It proves only restrained rigid-cutout mechanics. It does not approve the
articulated sword action, register the operation, dispatch a worker, persist a
canonical asset, approve QA, charge a customer, or grant production authority.

The adjacent
`living-frame-character-pixijs-remotion-composite-internal-test-v1` consumes
that process-bound PNG sequence once, supplies every exact PixiJS PNG as a
server-injected private input to the pinned Remotion runtime, renders eight
bounded chunks, retains exactly 120 intended frames, packages them through
FFmpeg, verifies the final H.264 dimensions/rate/frame count with FFprobe,
persists the MP4 create-only, and reopens it by exact digest and length. Visual
review of the first, middle, final, and every chunk-boundary neighborhood shows
a complete character with no missing torso pixels, no detached limb, no face
crossing, stable captions above the Living Frame plane, restrained whole-body
drift, and a return to the source pose.

## Regression

```text
npm run smoke:living-frame-character-animation-route-suitability
npm run smoke:living-frame-character-controlled-preparation
npm run smoke:living-frame-character-controlled-preparation-private-prompt
npm run smoke:living-frame-character-pixijs-internal-runtime
npm run smoke:living-frame-character-pixijs-remotion-composite-internal-test
npm run smoke:living-frame-animation-aware-illustration-private-composite-internal-test
npm run smoke:living-frame-rigging-v2
```
