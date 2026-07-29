# Living Frame selected-scene full-frame evidence readiness

Status: controlled, namespaced, read-only candidate. It does not register or
dispatch an operation, persist an artifact, execute QA, reconcile an asset
manifest, approve private review, render, bill, or promote production
readiness.

## Purpose

A selected-scene ComfyUI full-frame source/background plate is a generated
opaque input to the edit. It is not an isolated component, must not enter the
rembg/Sharp alpha branch, and is never the final video canvas.

The canonical downstream path remains:

```text
exact confirmed-ratio selected output
→ canonical create-only private image persistence
→ canonical asset_received + asset_quality QA
→ approved continuity reference/measurement when planned
→ documentary fact-safety revalidation/evidence when required
→ Living Frame scene evidence package
→ canonical asset-manifest reconciliation
→ canonical private review
→ Remotion final composition
```

The readiness projection binds the verified output candidate to those existing
owners. It does not execute any of them.

## Exact lineage

The compiler revalidates:

- the selected-scene request and its current approved snapshot;
- the full-frame ratio extension;
- the selected scene, component, output key, work item, generated asset intent,
  planned asset-manifest entry, and renderer layer;
- the canonical work-graph digest;
- the confirmed output-frame digest and exact dimensions;
- current MasterTiming and controlled-illustration cost/work binding;
- the private opaque-output observation; and
- the read-only alpha-chain reconciliation state.

The output is admitted only when the alpha-chain reconciliation says:

```text
not_applicable_to_confirmed_full_frame_plate
```

The current fixture resolves to the exact confirmed `1920x1080` landscape
frame. A silent `1024x1024` substitution is rejected. A square frame remains
possible only when the user-confirmed frame itself is square.

## Existing canonical owners

The receipt identifies, but does not replace:

- `persistCanonicalPrivateImageArtifact` for create-only private image
  persistence;
- `private-artifact-qa-authority-aggregate-v1` for immutable artifact and QA
  evidence;
- `asset_received_gate` and `asset_quality_gate`;
- `living-frame-visual-continuity-measurement-v1` when an approved aligned
  continuity reference exists;
- `documentaryFactSafetyPlan` for source-truth and claim safety;
- `living-frame-scene-evidence-package-v1` for structural scene evidence;
- the canonical approved asset manifest;
- `canonical_private_review_assembly_service`; and
- Remotion as the final-canvas owner.

The selected fixture carries a Visual Continuity Pack, so an approved reference
artifact and continuity evidence remain required. Its current illustrative
source-truth mode still requires canonical source-truth revalidation; it does
not manufacture a documentary-fact approval.

## Artifact policy

The readiness receipt contains:

- candidate artifact identity;
- committed content and decoded-RGBA digests;
- content type and byte length;
- exact frame dimensions; and
- immutable scene/work/asset lineage.

It contains no image bytes, paths, URLs, credentials, prompts, seeds, caller
dimensions, model aliases, commands, or environment. Verified bytes continue
out-of-band into the canonical private artifact owner.

For the future scene evidence package, the full-frame plate targets:

```text
artifactKind = opaque_raster
maskArtifact = null
alphaMeasurementReport = null
temporalMaskMeasurementReport = null
alphaEdgeDecontaminationReport = null
```

That package is not compiled until the canonical artifact, continuity, and
fact-safety evidence exists.

## Fixed runtime and cost boundaries

The projection preserves:

- one `comfyui` / `tool.comfyui.generate_controlled_image.v1` supervised GPU
  identity;
- one request unit, one image, and one future attempt;
- the fixed supervised Python entrypoint;
- the exact confinement digest;
- top-level `sam2` import denial;
- exact five-model, 11,700,367,157-byte atomic read-only mount lineage;
- one GPU attempt/cost event across ComfyUI, controlnet_aux, ControlNet,
  generic IP-Adapter, and LoRA;
- optional AuraFace outside that GPU attempt; and
- no duplicate charge in downstream artifact/QA binding.

Registry expansion remains semantic. Released, genuinely distinct executable
runtimes may add identities; weights, adapters, libraries, preprocessors, and
in-process capabilities do not.

## Adversarial coverage

The smoke fixture rejects:

- isolated-component substitution;
- unconfirmed square full-frame substitution;
- cross-output substitution;
- a forged ComfyUI final-canvas claim; and
- production-authority promotion.

It also verifies that the receipt is byte-free and subject-neutral.

## Files

- `src/types/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness.ts`
- `server/living-frame/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness.ts`
- `server/smoke/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness-smoke.ts`
