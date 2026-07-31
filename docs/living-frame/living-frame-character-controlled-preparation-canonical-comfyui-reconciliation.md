# Living Frame character preparation canonical ComfyUI reconciliation

Status date: 2026-07-31

Status:
`component_v1_candidate_lease_created_masked_plate_v2_extension_blocked`

This contract reconciles the two private character-preparation prompt units
with the canonical backend ComfyUI request surface. It records what is
compatible today and fails closed on the one exact shared-interface gap.

It does not create a second ComfyUI compiler, register an operation, dispatch a
worker, run a GPU, persist an asset, approve QA, charge credits, render a final
canvas, or claim production readiness.

## Result

The real Musashi controlled-preparation fixture contains two approved outputs:

| Unit | Current canonical result |
| --- | --- |
| Clean isolated component, 1024×1024 | Compatible with `canonical-comfyui-gpu-runtime-request-candidate-v1`; one process-bound, single-use candidate-input lease is created |
| Reconstructed plate, confirmed 1920×1080 | Incompatible with canonical v1; no candidate-input lease is created |

The isolated component remains the already-qualified selected-scene topology:

```text
approved conditioning
+ optional LoRA
+ optional external ControlNet image
+ optional generic IP-Adapter/CLIP Vision reference
+ EmptyLatentImage(1024, 1024)
→ KSampler(denoise=1)
→ VAEDecode
→ one SaveImageWebsocket
```

The private aliases are remapped to the exact canonical runtime aliases. The
receipt does not contain the graph, prompt text, private aliases, paths, URLs,
bytes, credentials, commands, or environment.

## Exact canonical v1 evidence

The reconciliation binds the current canonical backend surface at
`b6eb48277cbd`, where the relevant files are unchanged from the admitted
ComfyUI bridge:

| Canonical file | Git blob | SHA-256 |
| --- | --- | --- |
| `server/model-artifacts/canonical-comfyui-gpu-runtime-request-types.ts` | `212ae080049cee583131f869a42beccb6e09bff2` | `e127cdcf31872498b442bf9c1af834a6408ea2f56c862582b62f9dd436bec2b5` |
| `server/model-artifacts/canonical-comfyui-gpu-runtime-request.ts` | `20b6e7f5ab1ef228fd06ed92db2bac7de749b866` | `72b81aac5decd59cf7977fc75443c0e41fa7182732eae6b6eab769ae3d884043` |

Canonical v1:

- allowlists `EmptyLatentImage`;
- requires exactly one `EmptyLatentImage`;
- requires sampler `denoise=1`;
- accepts only `control_image_artifact` and
  `reference_image_artifact`; and
- does not allow `VAEEncodeForInpaint`, a source-plate slot, or an inpaint-mask
  slot.

The masked plate therefore cannot honestly be represented by v1.

## Required canonical v2 extension

The requested owner-side extension is intentionally narrow:

```text
target:
canonical-comfyui-gpu-runtime-request-candidate-v2

same tool:
comfyui

same operation:
tool.comfyui.generate_controlled_image.v1

additional nodes:
LoadImageMask
VAEEncodeForInpaint

additional exact private input slots:
source_plate_image_artifact       → source-plate.png
source_plate_inpaint_mask_artifact → source-plate-mask.png

exact inpaint settings:
mask encoding = gray8_mask_png_v1
mask polarity = white_one_means_inpaint
mask loader = LoadImageMask(channel=red), output 0
grow_mask_by = 6
KSampler.denoise = 0.55
```

For this graph family:

- the source plate and mask must match the confirmed output dimensions;
- `EmptyLatentImage` is forbidden;
- the source image, red-channel gray8 mask, VAE, and sampler edges are exact;
- plain `LoadImage` mask output is forbidden because an opaque grayscale PNG
  without alpha would produce a zero mask in the pinned source;
- arbitrary node or input-slot expansion remains forbidden;
- caller seed, dimensions, prompt, models, paths, URLs, bytes, credentials,
  commands, and environment remain forbidden;
- one request still means one supervised L4 process, one output image, one
  attempt, and one internal cost event; and
- the five model roles still share one atomic read-only mount lifetime.

This is a request-contract version bump, not a new executable tool identity or
new customer charge.

## Why this matters for the broken image

The rejected arm/sleeve/sword cutout exposed missing body and background
pixels. A deterministic rig cannot manufacture those pixels. The correct
sequence is:

```text
masked source-plate reconstruction
+ clean isolated component generation
→ private persistence and exact reread
→ hidden-plate / alpha / edge / face-clearance / attachment / continuity QA
→ rerun the character route
→ PixiJS, OpenToonz, or Blender only when the prepared topology qualifies
→ Remotion final composition
```

This contract prevents the system from pretending that the existing new-image
graph performed inpainting, and it prevents the broken cutout from being sent
back into rigging unchanged.

## Authority boundary

The feature branch owns only the reconciliation evidence and the process-bound
v1-compatible component candidate lease. The canonical backend owner retains:

- canonical request/compiler versioning;
- operation and runtime routing;
- approved snapshot and work graph;
- private artifact staging;
- dispatch and GPU-attempt admission;
- resource and internal-cost receipts;
- asset manifest reconciliation;
- QA and private review; and
- Remotion final-canvas admission.

All of those authorities remain false in this receipt.

## Regression

```text
npm run smoke:living-frame-character-controlled-preparation
npm run smoke:living-frame-character-masked-inpaint-comfyui-node-schema-evidence
npm run smoke:living-frame-character-controlled-preparation-private-prompt
npm run smoke:living-frame-character-controlled-preparation-canonical-comfyui-reconciliation
npm run smoke:living-frame-private-internal-end-to-end-audit
```
