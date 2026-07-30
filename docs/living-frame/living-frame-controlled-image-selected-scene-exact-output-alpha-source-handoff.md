# Living Frame selected-scene exact-output alpha-source handoff

Status: controlled, namespaced, process-private source handoff candidate.
Canonical work-graph admission, rembg/Sharp dispatch, artifact persistence,
asset-manifest mutation, QA approval, review, rendering, billing, and
production authority remain false.

## Purpose

The selected-scene controlled-image request may intentionally place more than
one exact generated output under one approved generation work item. The
current fixture has:

- one exact confirmed-ratio full-frame plate; and
- one exact 1024 by 1024 isolated component.

The full-frame plate must remain opaque and follow the existing
continuity/fact/manifest/review path. The isolated component must enter the
existing canonical alpha path:

```text
exact selected generated output
→ canonical rembg gray8 mask
→ canonical Sharp straight-alpha RGBA component
→ alpha / continuity / fact / destination QA
→ asset-manifest reconciliation
→ private review
→ Remotion final composition
```

The canonical work graph currently rejects this isolated source because the
parent generation work item has two expected outputs. The read-only
alpha-chain reconciliation froze that conflict. This handoff supplies the
missing exact-output source selector and a private one-shot byte lease without
creating a parallel work graph or dispatch lane.

## Exact source selector

`living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff-v1`
matches all of:

- selected scene;
- component;
- request unit;
- approved work-item ID and key;
- parent generation work-item key;
- expected-output index and count;
- output key;
- generated asset-intent ID;
- artifact type and content type;
- planned asset-manifest entry;
- renderer layer;
- private output candidate; and
- approved snapshot, selected-scene, MasterTiming, confirmed-frame, work-graph,
  and cost/work digests.

The parent may contain multiple outputs only because the selector proves one
unique output index and one unique generated asset-intent at that same index.
Duplicate output keys, duplicate asset-intent IDs, cross-output substitution,
and cross-scene/work/component/manifest substitution fail closed.

## Private source lease

The handoff rereads the already verified selected-scene opaque PNG and decoded
RGBA bytes through a process-bound server reader. It independently checks:

- exact observation and reconciliation lineage;
- exact source byte length and SHA-256;
- exact decoded RGBA SHA-256;
- exact 1024 by 1024 shape;
- exactly 4,194,304 decoded RGBA bytes; and
- alpha 255 for every pixel.

It then emits:

1. one serializable byte-free receipt; and
2. one process-bound, single-use private source lease.

Consuming the lease yields the PNG and decoded RGBA bytes plus the exact source
selector. Copying or reusing the reader or lease fails closed. The receipt
contains no bytes, paths, URLs, prompts, aliases, credentials, seeds, model
selection, commands, environment, cost amount, price, credits, service fee,
reservation, wallet, or ledger data.

The lease is not a canonical worker lease. It grants no dispatch, work-item,
work-graph, rembg admission, Sharp admission, artifact, QA, review, render, or
production authority.

## Canonical-owner continuation

The canonical work-graph owner can reconcile this handoff by:

1. admitting the exact parent-output selector for
   `living_frame_generated_opaque_still`;
2. projecting the existing `generate_mask_asset` item using `rembg` and
   `tool.rembg.remove_image_background.v1`;
3. projecting the existing `process_image_asset` item using `sharp` and
   `tool.sharp.prepare_approved_image_asset.v1`;
4. preserving the generation output as a dependency of both rembg and Sharp;
5. preserving the rembg mask as the second Sharp dependency;
6. keeping their existing independent cost owners and QA gates; and
7. leaving final composition with Remotion.

This namespaced candidate does not perform any of those mutations.

## Runtime and registry policy

The handoff preserves:

- one `comfyui` identity;
- one `tool.comfyui.generate_controlled_image.v1` operation;
- fixed supervised Python entrypoint;
- exact confinement digest;
- top-level `sam2` denial;
- exact five-model, 11,700,367,157-byte atomic read-only mount lifetime;
- one request / one image / one attempt semantics; and
- one GPU attempt and cost event for ComfyUI, `controlnet_aux`, ControlNet,
  generic IP-Adapter, and LoRA.

rembg and Sharp keep their existing separate executable/cost boundaries. The
observed registry count is not a cap. Expansion is permitted only for genuinely
distinct released executables; weights, adapters, libraries, preprocessors,
and in-host capabilities do not become fake tool identities.

## Adversarial coverage

The smoke fixture rejects:

- full-frame/square alpha-source substitution;
- cross-scene, cross-output, cross-work, and cross-asset substitution;
- wrong parent output index;
- wrong generated asset-intent;
- byte and decoded-RGBA digest mismatch;
- non-opaque decoded alpha;
- copied or reused readers;
- copied or reused leases;
- raw path injection;
- dispatch/final-canvas/production promotion; and
- tampered receipt authority.

## Files

- `src/types/living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff.ts`
- `server/living-frame/living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff.ts`
- `server/smoke/living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff-smoke.ts`
