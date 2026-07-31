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

`living-frame-character-animation-route-decision-v1` prevents that class of
false positive.

## Professional route policy

| Asset and action evidence | Route |
| --- | --- |
| Rigid cutout, known pivot, ambient or restrained action, no new pixels required | PixiJS rigid cutout rendered as a component below the Remotion final canvas |
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

- the restrained strike routes to the PixiJS rigid-pivot component path, with
  Remotion retaining final-canvas ownership;
- a large new pose routes to controlled ComfyUI key-pose generation; and
- generic Blender deformation is rejected.

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

## Regression

```text
npm run smoke:living-frame-character-animation-route-suitability
npm run smoke:living-frame-animation-aware-illustration-private-composite-internal-test
npm run smoke:living-frame-rigging-v2
```
