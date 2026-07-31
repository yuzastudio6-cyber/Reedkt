# Living Frame character animation route suitability

Status: source contract and private internal fixture evidence. No provider,
worker, operation, billing, public-delivery, or production authority.

## Superseding owner rule: living subjects are never rigged

As of 2026-07-31, humans, animals, plants, and any other living or organic
subject must use complete-frame pose animation. Part-based puppet deformation,
character armatures, Plastic meshes, and rigid whole-character cutout motion
cannot be admitted for those subjects. Existing Blender, OpenToonz, and PixiJS
character-route artifacts remain historical engineering evidence only; they
cannot authorize new Living Frame execution.

"Complete-frame" means that each key pose and accepted in-between is a coherent
whole-character frame. It does not mean independently asking an image model to
invent every unrelated frame. Action-specific complete key poses are still
selected by Head Intelligence, placed by StoryTiming, visually accepted, and
only then passed to a qualified complete-frame interpolation route.

Rigging is reserved for nonliving rigid or mechanical objects such as cars,
trains, bicycles, wheels, doors, rotors, gears, and related mechanisms. The
mechanical-rig contract remains blocked until the owner supplies its detailed
design. The source-only `living-frame-motion-subject-class-gate-v1` enforces
this distinction and rejects unknown classification instead of defaulting it
to a mechanical route.

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

`living-frame-character-animation-route-decision-v2` records the earlier route
evidence. It is no longer sufficient by itself. Every current route must also
pass `living-frame-motion-subject-class-gate-v1`.

## Professional route policy

| Asset and action evidence | Route |
| --- | --- |
| Living or organic subject with an admissible illustrated action | Controlled complete-character key poses, accepted complete-frame in-betweens, and Remotion final composition |
| Living or organic subject requiring continuous natural motion beyond the bounded complete-frame route | Real Motion fallback or deliberate no animation |
| Nonliving rigid/editorial support element | Qualified PixiJS support motion below the Remotion final canvas |
| Vehicle, machine, or other rigid mechanical object | Blocked until the owner-defined mechanical-rig specification is attached |
| Unknown or conflicting subject classification | Deliberate no-animation decision until classification is resolved |

Every accepted character-motion route must also carry a reviewed protected-face
path and attachment-continuity decision. A technically valid pivot or mesh is
rejected when it moves the component across the face improperly or visually
disconnects it from the body.

For the current Musashi artwork, all Blender, OpenToonz, and PixiJS body-rig
routes are rejected because the subject is living. A meaningful sword action
may proceed only through accepted complete-character key poses and accepted
complete-frame in-betweens. If that route cannot meet the professional visual
bar, character motion is disabled for the scene. Remotion retains final-canvas
ownership in either case.

This distinction is important: PixiJS can animate an approved nonliving rigid
or mechanical component, but it cannot repair or animate living anatomy. Tool
execution, subject classification, and source preparation are separate gates.

The later airship-navigator experiment demonstrated that separated parts are
still insufficient. Its real Blender and Remotion paths technically rendered
eight rigid islands, preserved the protected face, and returned to the source
pose. Mandatory inspection of the actual clip nevertheless rejected the
result: visible socket joints, disconnected and elongated arm anatomy, unclear
hand-to-prop attachment, and a floating coat flap made the sequence
unprofessional. The artifact is engineering-only negative evidence. It is not
an accepted Blender character route or visual-QA pass.

`living-frame-ai-2d-character-motion-strategy-v1` is the replacement planning
boundary. Meaningful illustrated-character pose changes now prefer complete,
controlled AI-generated key poses. Blender is never the generic still-image
character route and OpenToonz or Blender may be considered only for assets
professionally authored for those systems. Technical render metrics cannot
approve visual quality.

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

Blender, OpenToonz, and PixiJS rigging remain candidates only for professionally
authored nonliving mechanical objects after the owner-defined mechanical-rig
specification is complete. Likely evidence will include:

- separated rigid or mechanical parts;
- visible and reviewed pivots;
- reconstructed hidden-surface artwork;
- reviewed constraints, parent-child relationships, mesh topology, and
  rigidity weights where applicable;
- physically meaningful mechanical motion; and
- exact component output below the Remotion final-canvas layer.

PixiJS is also the preferred lightweight route for many mechanical parts and
editorial elements: wheels, rotors, doors, levers, radar dishes, routes,
particles, masks, filters, and parent-child cutouts. It animates prepared
pixels; it does not invent hidden anatomy or new pose artwork. Remotion remains
the final layout, caption, audio, and export compositor.

The private `living-frame-character-pixijs-internal-runtime-v2` evidence is now
historical engineering-only evidence. It proves that a pinned PixiJS entrypoint
can render a rigid cutout, but the subject-class gate prevents that result from
admitting whole-character motion for a living subject. It does not register the
operation, dispatch a worker, persist a canonical asset, approve QA, charge a
customer, or grant production authority.

The adjacent
`living-frame-character-pixijs-remotion-composite-internal-test-v1` consumes
that process-bound PNG sequence once, supplies every exact PixiJS PNG as a
server-injected private input to the pinned Remotion runtime, renders eight
bounded chunks, retains exactly 120 intended frames, packages them through
FFmpeg, verifies the final H.264 dimensions/rate/frame count with FFprobe,
persists the MP4 create-only, and reopens it by exact digest and length. Visual
review of the first, middle, final, and every chunk-boundary neighborhood is
retained only as historical renderer evidence; it cannot override the current
living-subject no-rig rule.

## Regression

```text
npm run smoke:living-frame-character-animation-route-suitability
npm run smoke:living-frame-motion-subject-class-gate
npm run smoke:living-frame-character-controlled-preparation
npm run smoke:living-frame-character-controlled-preparation-private-prompt
npm run smoke:living-frame-character-pixijs-internal-runtime
npm run smoke:living-frame-character-pixijs-remotion-composite-internal-test
npm run smoke:living-frame-airship-navigator-articulated-blender-private-internal-test
npm run smoke:living-frame-animation-aware-illustration-private-composite-internal-test
npm run smoke:living-frame-rigging-v2
```
