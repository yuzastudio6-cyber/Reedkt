# Living Frame selected-scene private output observation

Status date: 2026-07-29

Status:
`selected_scene_private_output_verified_downstream_admission_pending`

`living-frame-controlled-image-selected-scene-private-output-observation-v1`
is a server-only, non-authoritative observation boundary for one opaque PNG
candidate associated with one exact selected-scene private ComfyUI operation
request receipt. It does not dispatch the request, infer worker completion,
create a GPU attempt, persist an artifact, update the asset manifest, attribute
actual cost, approve QA, approve private review, authorize rendering, or claim
production readiness.

## Exact lineage

One process-bound reader is created from one verified
`living-frame-controlled-image-selected-scene-private-operation-request-v1`
receipt. Its binding freezes:

- operation-request receipt ID and digest;
- private operation-request digest;
- materialization unit and request unit;
- selected scene and component;
- approved work item and planned asset-manifest entry;
- approved output key;
- confirmed output-frame digest; and
- exact expected width and height.

The server-owned output packet must repeat that exact lineage. Cross-scene,
cross-component, cross-work-item, cross-output, cross-manifest, request,
frame-digest, or dimension substitutions fail closed. The compatibility
benchmark request and output paths cannot substitute for this selected-scene
contract.

The output reader and verified-output consumer are both process-bound and
single-use. Output PNG bytes and decoded RGBA bytes are delivered only through
the consumer. The serializable observation contains hashes, counts, lineage,
dimensions, dispositions, and explicit non-authority flags; it contains no
raw media, prompt, model alias, path, URL, credential, seed, command,
environment, price, credit, reservation, wallet, or ledger data.

## Exact confirmed dimensions

The observer accepts the dimensions frozen by the selected-scene operation
request:

- isolated component: exactly `1024 × 1024`;
- confirmed full-frame plate: the exact approved output-frame dimensions; and
- current landscape fixture: exactly `1920 × 1080`.

The verifier accepts only a bounded, non-interlaced, eight-bit RGB PNG with no
alpha channel or `tRNS` chunk. It validates PNG structure and CRCs, bounds
decompression, reverses PNG row filters, expands RGB to RGBA, and recomputes
the alpha measurement from decoded bytes. A full-frame `1920 × 1080` request
cannot be replaced by a `1024 × 1024` square, rotated `1080 × 1920` output, or
any caller-selected dimensions. Decode limits remain aligned with the
confirmed-frame extension: at most `4096` pixels on either axis and
`8,294,400` total pixels.

ComfyUI still creates an opaque image candidate, not the final video canvas.
Remotion remains the final composition owner.

## Downstream disposition

The observer does not pretend that every opaque output has the same next
step.

### Isolated component

An isolated `1024 × 1024` output is classified as:

```text
opaque_component_source_requires_
segmentation_matting_decontamination_and_alpha_qa
```

It still requires the canonical generated-still alpha path, including source
and mask reread, segmentation or matting, edge decontamination, straight-alpha
component construction, multi-background measurement, destination-composite
measurement, artifact QA, manifest reconciliation, continuity/fact QA, and
private review. This observation does not route or execute that path.

### Full-frame source or background plate

A confirmed-ratio full-frame output is classified as:

```text
opaque_full_frame_plate_requires_
destination_continuity_and_documentary_fact_qa
```

It is not silently routed through the isolated-component alpha path. It still
requires create-only private persistence, canonical artifact QA, destination
composition checks, visual-continuity review, documentary-fact review where
applicable, manifest reconciliation, and private review before Remotion can
use it.

## Fixed runtime and cost lineage

The observation preserves, but does not prove execution of, the frozen
selected-scene runtime policy:

- one `comfyui` identity;
- one `tool.comfyui.generate_controlled_image.v1` operation;
- fixed supervised Python entrypoint;
- frozen confinement digest;
- non-root, read-only root filesystem, dropped capabilities, and
  no-new-privileges requirements;
- external network and runtime downloads denied;
- `sam2` and `sam2.*` denied;
- exact five model roles in one atomic read-only mount;
- exact aggregate model size `11,700,367,157` bytes;
- before-and-after verification of all five roles; and
- one process, one request, one output, and one future GPU attempt.

ComfyUI, `controlnet_aux`, ControlNet, generic IP-Adapter, and LoRA remain
capability roles inside that one future GPU attempt and one future actual-cost
event. AuraFace remains outside the GPU attempt.

Signed/scanned image evidence and license, vulnerability, dependency, and
model-weight disposition remain open release gates.

The registry policy remains semantic. The observed registry count is not a
cap; expansion is permitted for genuinely distinct released executables.
Weights, adapters, libraries, preprocessors, and internal capabilities do not
become fake identities.

## Existing owners preserved

This boundary deliberately reuses rather than replaces:

- approved snapshot ownership;
- MasterTiming ownership;
- canonical work-graph ownership;
- estimate and actual-cost ownership;
- create-only private artifact persistence;
- canonical asset-manifest reconciliation;
- generated-still alpha and Sharp component ownership;
- visual-continuity and documentary-fact QA;
- private-review ownership; and
- Remotion final-canvas ownership.

All operation registration, dispatch, worker completion, GPU execution,
artifact, cost, QA, review, render, billing, and production flags remain
false.

## Current shared-interface conflict

The existing compatibility benchmark GPU request and canonical ComfyUI host
request both require literal `1024 × 1024` output. They cannot safely consume
the selected-scene `1920 × 1080` receipt.

The canonical backend owner must add a selected-scene dispatch/wire envelope
or safely generalize the canonical host boundary while preserving:

- benchmark `1024 × 1024` behavior;
- exact selected-scene dimensions;
- fixed supervised entrypoint and confinement;
- `sam2` denial;
- atomic five-model mount lifetime;
- one-request/one-attempt semantics; and
- all existing canonical authority boundaries.

This namespaced observer does not mutate that shared runtime or dispatch path.

## Validation

The smoke fixture covers:

- exact `1920 × 1080` full-frame observation;
- exact `1024 × 1024` isolated-component observation;
- distinct downstream dispositions;
- one-shot reader and consumer enforcement;
- output byte and decoded-RGBA out-of-band delivery;
- PNG structure, CRC, bounded decode, exact dimensions, and opaque-alpha
  measurement;
- cross-scene/component/work/output/manifest rejection;
- frame, ratio, square, portrait, digest, and byte-length rejection;
- benchmark substitution rejection;
- RGBA/alpha PNG rejection;
- operation-receipt tamper rejection;
- fixed runtime and `sam2` policy preservation;
- one GPU attempt/cost-event lineage;
- registry expansion semantics; and
- artifact, cost, QA, review, render, final-canvas, and production promotion
  rejection.
