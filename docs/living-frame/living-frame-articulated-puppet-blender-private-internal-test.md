# Living Frame articulated puppet Blender private internal test

Status date: 2026-07-31

Status:
`technical_execution_passed_professional_visual_review_rejected`

This fixture attempted to correct the failure demonstrated by the merged
Musashi arm/sleeve/hand/sword cutout by starting from a fictional,
illustrative character sheet containing eight deliberately separated pieces.
The real Blender and Remotion paths executed, but mandatory inspection of the
rendered clip rejected the result. Separation alone did not produce a
professional character animation.

1. complete static body and lower torso;
2. head with a neck socket;
3. upper arm with shoulder and elbow overlap artwork;
4. forearm with elbow and wrist overlap artwork;
5. hand with a wrist socket;
6. independent spyglass;
7. independent hair lock; and
8. independent coat flap.

The committed source fixture is:

```text
server/smoke/fixtures/assets/
  living-frame-airship-navigator-articulated-puppet-sheet-v1.png
```

It is 1536×1024, 1,960,401 bytes, and has SHA-256:

```text
0a6d52335e32614d57a79ea4f93da81a3a325363aea319d21895cfcddde90b37
```

The character is fictional, generated with OpenAI ImageGen for this private
fixture, and explicitly illustrative rather than archival or documentary
evidence.

## Why technical riggability was not enough

The source contract
`living-frame-articulated-puppet-sheet-internal-test-v1` freezes:

- the exact source bytes and dimensions;
- exactly eight fixture-specific reviewed source rectangles;
- a reviewed socket or attachment pivot for every piece;
- the destination rectangle and depth for every piece;
- one rigid bone owner for every atlas island;
- intended overlap artwork at the neck, shoulder, elbow, and wrist;
- green-chroma-to-straight-alpha preparation;
- edge color decontamination;
- the rule that only the prepared alpha atlas reaches Blender; and
- the prohibition on generic whole-image deformation.

The resulting Blender mesh is not a single generic deformable rectangle. It is
eight disconnected four-vertex islands using one content-addressed texture
atlas. Every island has a single 1.0 bone weight, so the artwork remains rigid
while the armature changes the parent/child transforms. That implementation is
technically deterministic, but it is also the central visual failure: rigid
planes and exposed socket artwork read as disconnected mechanical segments
rather than continuous illustrated anatomy.

```text
body       -> root bone
head       -> head bone
hair lock  -> hair bone
coat flap  -> coat bone
upper arm  -> upper-arm bone
forearm    -> forearm bone
hand       -> hand bone
spyglass   -> prop bone
```

The articulated arm is:

```text
root
  -> upper arm
      -> forearm
          -> hand
              -> spyglass
```

The approved three-bone IK chain ends at the hand. The spyglass follows the
hand as a rigid child. The action extends to screen right and deliberately
avoids the protected face rectangle.

## Tool responsibilities

The tools do not compete for ownership:

| Tool or system | Responsibility |
| --- | --- |
| Head Intelligence | Select the narrative action and the minimum professional route from structured evidence |
| Deterministic image preparation | Convert the exact chroma sheet to a reviewed straight-alpha atlas and decontaminate edges |
| Blender fixed adapter | Engineering-only evidence for an already professionally authored rig; it is not the default still-character animation route |
| PixiJS | Optional lightweight hair, cloth, particle, or editorial follow motion when it is professionally sufficient; it does not repair anatomy |
| ComfyUI | Generate controlled anchor poses only when a requested pose needs pixels absent from the source; never generate every frame independently |
| Remotion | Own the final canvas, layout, captions, audio, timing projection, and final composition |

Blender is used headlessly through the existing fixed reviewed `bpy` adapter.
The AI supplies typed rig and action data; it does not write Python, choose a
script, pass shell arguments, select arbitrary plugins, or control the final
canvas.

## Verified technical execution and rejected visual result

The bounded private runtime smoke is:

```text
npm run smoke:living-frame-airship-navigator-articulated-blender-private-internal-test
```

The bounded private Blender and Remotion run executed against the exact
committed source. It technically:

- rehash the exact source;
- verify all eight regions contain prepared alpha pixels;
- compile the separated-parts route to `blender_articulated_2_5d`;
- reject generic whole-image deformation;
- compile 32 vertices, 16 triangles, eight bones, and one three-bone IK chain;
- render all 60 approved 1920×1080 frames through the actual fixed Blender
  adapter;
- observe transparent RGBA, gray mask, and OpenEXR depth;
- observe meaningful arm motion;
- observe a stable protected face;
- retained one connected principal pixel region;
- observe no material green spill;
- restore the exact initial pose; and
- persisted only the QA-passed prepared atlas plus initial, demonstration, and
  restored component frames into a fixed create-only private local review
  root; and
- keep operation, dispatch, canonical asset persistence, QA approval, billing,
  public delivery, production, and final-canvas authority false.

Measured evidence:

```text
reviewed parts:                         8
disconnected mesh islands:             8
rigid weighted vertices:               32
articulated bones:                      8
IK chain length:                       3
rendered frames:                       60
initial nontransparent pixels:         224,943
demonstration motion pixel delta:       96,940
protected-face pixel delta:             0
restored-frame pixel delta:             0
initial largest connected share:        0.9935228035546783
demonstration largest connected share:  0.9926936335693787
```

Those measurements do not constitute professional visual acceptance.
Mandatory inspection of the actual MP4 rejected the result for five blocking
reasons:

1. visible neck, shoulder, elbow, and wrist socket artwork;
2. an articulated arm that reads as disconnected mechanical segments;
3. implausible limb length during extension;
4. unclear hand-to-spyglass attachment; and
5. a detached coat flap that reads as a floating object.

The result is engineering-only evidence that eight isolated planes can travel
through the fixed Blender adapter and Remotion. It is not an accepted Living
Frame character look, professional QA result, or private-review approval.

## Remotion private review result

The same smoke includes a private Remotion review adapter. The bounded runtime
executed after the shared media owner granted an exact window. The adapter:

- revalidates the exact puppet-sheet, route, rig, action, Blender result, and
  all 60 content-addressed RGBA frame commitments;
- rejects substituted frames, dimensions, timing, source lineage, topology,
  final-canvas ownership, or authority promotion;
- renders four bounded Remotion chunks with no more than 16 injected frame
  overlays per chunk;
- packages only the exact approved 60 frames through FFmpeg;
- verifies the 640×360, 30fps, H.264 private review with FFprobe;
- measures the initial, demonstration, and restored compositions;
- persists the MP4 create-only in private content-addressed storage;
- issues one process-bound, single-use playback lease; and
- keeps Remotion as the only final-canvas compositor.

The resulting 640×360, 60-frame private review MP4 passed technical media and
composition checks but failed professional visual inspection. The contract
therefore records `technical_pass_professional_visual_rejected`, keeps
`privateInternalReviewEvidencePassed = false`, and authorizes no downstream
use.

## Current boundary

This slice is private internal evidence only. It does not register Blender,
admit canonical work, dispatch a worker, persist a canonical asset, reconcile
an asset manifest, create actual cost, charge a customer, approve QA, or grant
public/production delivery.

The next character-animation step is not another Blender rerun. It is a
separate AI-assisted 2D feasibility path based on complete controlled key
poses, mandatory per-pose inspection, bounded cartoon interpolation research,
and rendered-motion visual acceptance. Blender remains available only for
professionally authored rigs and non-character 3D/2.5D work. Remotion remains
the final canvas.
