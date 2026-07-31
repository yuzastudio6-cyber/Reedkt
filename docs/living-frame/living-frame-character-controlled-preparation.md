# Living Frame character controlled preparation

Status: private, non-dispatched prompt-topology evidence. No operation
registration, runtime, asset, cost, QA approval, public delivery, or production
authority.

## Why this exists

The rejected Musashi sword-arm result exposed two separate problems:

1. moving the extracted arm reveals pixels that do not exist in the original
   flattened illustration; and
2. the extracted arm/sleeve/hand/sword boundary is not a professionally clean,
   independently animatable component.

Blender, OpenToonz, and PixiJS can animate prepared pixels, but none of them
can reconstruct the missing source plate or reliably repair fused painted
anatomy. Sending that source directly to a rig therefore fails closed.

`living-frame-character-controlled-preparation-v1` binds the rejected
`living-frame-character-animation-route-decision-v2` result to two exact
approved generated outputs:

| Output | Canvas | Purpose |
| --- | --- | --- |
| Reconstructed source/background plate | Exact confirmed output ratio, 1920×1080 in the regression fixture | Reconstruct only the masked pixels exposed by component motion |
| Clean isolated component | 1024×1024 | Produce a controlled, separable source for alpha preparation and the next deterministic route |

Each output remains one approved work item, one future ComfyUI request, one
future GPU attempt, and one future cost event. There is no hidden batching and
no per-frame generation.

## The graph correction

The earlier selected-scene ComfyUI graph uses `EmptyLatentImage`. That graph is
valid for a new controlled still, but it cannot perform masked source-plate
reconstruction. Re-signing the generic graph as “inpainting” would be a false
qualification.

The new namespaced plate graph instead requires:

```text
approved source plate
+ approved private inpaint mask
+ approved conditioning/control inputs
→ source plate through LoadImage
→ opaque gray8 mask through LoadImageMask(channel=red)
→ VAEEncodeForInpaint
→ KSampler
→ VAEDecode
→ SaveImageWebsocket
```

`EmptyLatentImage` is forbidden in the masked plate unit. The component unit
continues to use the already-qualified selected-scene graph family. Both
topologies end in exactly one `SaveImageWebsocket` node.

The private materializer:

- revalidates the exact character route and selected-scene/approved-output
  lineage;
- keeps the confirmed full-frame plate at its exact ratio rather than silently
  substituting 1024×1024;
- keeps the isolated component at 1024×1024;
- derives seeds server-side;
- excludes source, mask, prompt, model, path, URL, bytes, credential, command,
  and environment values from the receipt;
- creates process-bound, single-use private prompt leases;
- preserves the fixed supervised process, five atomic read-only model roles,
  and `sam2` import denial; and
- grants no dispatch or runtime authority.

## What ComfyUI does—and does not do

ComfyUI is the controlled preparation host. It may reconstruct a masked plate,
prepare a clean component, or generate a small set of approved anchor poses.
It does not independently generate all animation frames.

After real generation and QA, the Head Intelligence must recompile the
character route:

```text
prepared component + reconstructed plate
→ hidden-plate, alpha, edge, face-clearance, attachment, and continuity QA
→ character route recompilation
→ PixiJS / OpenToonz / Blender when the prepared topology qualifies
→ Real Motion fallback only when deterministic methods remain insufficient
→ Remotion final composition
```

This preserves the division of responsibility:

- ComfyUI prepares missing or controlled still pixels.
- PixiJS animates simple prepared rigid components.
- OpenToonz animates reviewed flat meshes.
- Blender animates reviewed separated articulated 2.5D parts.
- Real Motion handles continuous natural motion that deterministic rigs cannot.
- Remotion owns the final canvas, captions, audio, layout, and export.

## QA required before rerouting

The generated outputs are not automatically accepted. Required checks include:

- hidden source plate completeness;
- component-edge decontamination;
- alpha and destination-composite quality;
- protected-face path clearance;
- attachment continuity;
- character, prop, costume, and illustration-style continuity; and
- preservation of the approved illustrative/fact-safety treatment.

Failure falls back to a simpler professional treatment or no animation. It
does not authorize use of the broken cutout.

## Current evidence and remaining gate

The source contract, exact pinned-image node-schema qualification, and private
prompt topology are locally green. The fixture
materializes:

- one 12-node 1920×1080 masked-inpaint graph whose gray8 mask uses
  `LoadImageMask(channel=red)` output `0`;
- one 15-node 1024×1024 controlled component graph;
- two process-bound single-use leases; and
- byte-free lineage receipts.

The canonical reconciliation is now also explicit:

- the clean 1024×1024 component produces one exact
  `canonical-comfyui-gpu-runtime-request-candidate-v1`-compatible,
  process-bound candidate-input lease;
- the 1920×1080 masked plate does not produce a v1 lease because canonical v1
  requires `EmptyLatentImage`, `denoise=1`, and only ControlNet/reference input
  slots; and
- the plate instead records one narrowly versioned
  `canonical-comfyui-gpu-runtime-request-candidate-v2` owner requirement for
  `LoadImageMask`, `VAEEncodeForInpaint`, exact source/mask slots,
  `gray8_mask_png_v1`, white/one inpaint polarity, red-channel mask loading,
  `grow_mask_by=6`, and `denoise=0.55`, while retaining the same `comfyui`
  identity and operation.

No model was loaded and no image was generated. The remaining internal gate is
the canonical owner-side v2 request/runtime extension followed by the
already-known released-image/real-L4 path: exact gray8 mask staging,
atomic five-model load, one-output execution, resource receipt, create-only
persistence, and the QA set above. The node-schema gate itself is now closed by
`living-frame-character-masked-inpaint-comfyui-node-schema-evidence-v1`.

## Regression

```text
npm run smoke:living-frame-character-controlled-preparation
npm run smoke:living-frame-character-masked-inpaint-comfyui-node-schema-evidence
npm run smoke:living-frame-character-controlled-preparation-private-prompt
npm run smoke:living-frame-character-controlled-preparation-canonical-comfyui-reconciliation
npm run smoke:living-frame-character-animation-route-suitability
npm run smoke:living-frame-private-internal-end-to-end-audit
```
