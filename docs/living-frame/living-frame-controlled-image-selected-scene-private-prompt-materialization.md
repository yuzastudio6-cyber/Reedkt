# Living Frame selected-scene private prompt materialization

Status date: 2026-07-29

Status:
`selected_scene_private_prompt_request_leases_created_dispatch_blocked`

`living-frame-controlled-image-selected-scene-private-prompt-materialization-v1`
is the server-only bridge from the approved selected-scene request plus its
confirmed-frame ratio extension to a real private ComfyUI API-format prompt.
It is not the compatibility-benchmark prompt path.

The bridge creates no tool registration, approved operation binding, worker
lease, queue item, GPU attempt, cost receipt, asset, asset-manifest mutation,
QA approval, render, customer charge, or production authority.

The later
`living-frame-controlled-image-selected-scene-private-conditioning-binding-v1`
provides the animation-aware source boundary for these private text slots. It
derives conditioning from the exact selected semantic scene, component,
Visual Continuity Pack, scene design sheet, source truth, and confirmed frame.
Its process-bound adapter accepts an alias-only packet with fixed pending
sentinels, consumes one private conditioning lease per output, and proves that
the digests entering this materializer match the approved conditioning
receipt. Generic fixture text and compatibility-benchmark text are not an
approved production source. See
`docs/living-frame/living-frame-controlled-image-selected-scene-private-conditioning-binding.md`.

## Exact source revalidation

Before reading any private conditioning value, the materializer revalidates:

- the complete selected-scene request against its original server inputs;
- the selected scene and Visual Continuity Pack lineage;
- the immutable approved snapshot and approved plan lineage;
- the current MasterTiming digest;
- the canonical pending work-graph projection;
- the exact planned asset-manifest entry and approved generated output;
- the controlled-illustration cost/work binding;
- the confirmed output-frame expectation;
- the full-frame ratio extension against its server inputs;
- the current non-executable ComfyUI admission candidate;
- the fixed supervised-process expectation;
- the frozen runtime-confinement digest; and
- the operation-scoped denial of `sam2`.

The private packet must have exactly one unit for every selected-scene request
unit, in the same order. Scene, request-unit, work-item, output, asset-manifest,
conditioning-locator, and digest substitutions fail closed.

## One unit and one future attempt

Every approved generated output becomes exactly one materialization unit:

```text
approved generated work item/output
  -> one selected-scene request unit
  -> one private prompt materialization unit
  -> one process-bound single-use prompt-request lease
  -> at most one future supervised GPU attempt
```

The materializer does not batch outputs. Each private request asks for one PNG
and has no dispatch, runtime, final-canvas, or production authority.

The receipt is byte-free. It contains stable lineage, digests, node and slot
counts, graph features, canvas dimensions, security policy, and explicit
non-authority flags. Raw prompt text, private model or image aliases, paths,
URLs, bytes, credentials, commands, environment, and the deterministic seed
never enter the serializable receipt.

## Qualified selected-scene graph family

The graph is compiled independently from the selected-scene control policy.
The benchmark case and recipe materializer cannot substitute for it.

The only available graph features are:

- required SDXL base generation;
- optional approved LoRA loading;
- optional ControlNet using a deterministic control image prepared outside
  ComfyUI; and
- optional generic IP-Adapter with CLIP Vision and an approved continuity
  reference.

The frozen sampler policy remains:

```text
steps: 24
cfg: 5.5
sampler: dpmpp_2m
scheduler: karras
denoise: 1
batch: 1
```

The seed is derived server-side from the selected request-unit digest, exact
approved work item, and output key. No caller seed is accepted.

FaceID, InsightFace, embedding/unified loaders, in-graph pose/depth/canny
preprocessors, `PreviewImage`, and arbitrary `SaveImage` nodes remain
forbidden. The only output node is one `SaveImageWebsocket`.

## Confirmed-frame dimensions

Isolated components remain exactly `1024 × 1024`.

Source stills, opaque background plates, and reconstructed background plates
use the width and height from their verified full-frame ratio-extension unit.
For the current landscape fixture that is exactly `1920 × 1080`; portrait and
custom frames retain their own confirmed dimensions.

The caller cannot provide width or height, and a generic `1024 × 1024`
substitution cannot replace a confirmed non-square plate. ComfyUI creates a
still input asset only. Remotion remains the final video-canvas owner.

## Private reader and lease boundary

Private values arrive through a process-bound reader created by the server.
That reader:

- accepts only a server-owned locator;
- is consumed once;
- must return the exact current packet shape;
- cannot accept a caller packet, prompt, slot value, model choice, seed,
  dimensions, path, URL, bytes, credential, command, or environment.

The resulting prompt request remains in a process-local weak binding behind a
single-use lease. Copying the lease object does not copy authority. Consuming
the real lease once returns the private prompt request and permanently removes
the process-local binding. Consumption still does not dispatch it.

## Atomic model and runtime boundary

Each unit preserves the same future-attempt requirements:

- exactly five canonical model roles;
- exact aggregate artifact size `11,700,367,157` bytes;
- one atomic read-only mount lifetime;
- before-and-after model verification;
- one fixed supervised Python process;
- the frozen confinement digest;
- `sam2` and `sam2.*` denied;
- no runtime download or external network;
- one output image; and
- no output batching.

ComfyUI, `comfyui_controlnet_aux`, ControlNet, generic IP-Adapter, and LoRA
remain capabilities inside one GPU host attempt and one attempt-cost boundary.
They do not become fake production-tool identities. AuraFace may remain a
separate optional CPU continuity-QA operation if its independent released
runtime and cost boundary is approved.

The registry may expand beyond its current observed count when genuinely
distinct executable identities pass their own release gates. This contract
does not impose an exact-count cap and does not mutate the current shared
registry or its temporary exact-count compatibility guard.

## Adversarial coverage

The smoke fixture rejects:

- reused or copied process-bound readers and leases;
- caller seed, dimensions, prompt, model, path, URL, bytes, credentials,
  command, or environment;
- benchmark-case substitution;
- cross-scene, cross-work-item, cross-output, or cross-manifest substitution;
- FaceID or InsightFace nodes;
- in-graph preprocessors;
- arbitrary preview/save nodes;
- full-frame square substitution;
- a ComfyUI final-canvas claim;
- relaxed confinement or `sam2` policy;
- raw private values in a receipt; and
- operation, dispatch, runtime, asset, approval, or production promotion.

## Remaining gates

All canonical release gates remain open:

- semantic reconciliation of the shared registry-count compatibility guard;
- canonical ComfyUI identity and operation admission;
- exact approved-work-item operation binding;
- signed and scanned non-root GPU image;
- license, vulnerability, dependency, and model-weight disposition;
- real NVIDIA L4 memory, latency, deterministic, and quality evidence;
- private dispatch and canonical worker leases;
- canonical resource and actual-cost receipts;
- create-only asset persistence;
- alpha, continuity, factual, and destination-composite QA;
- asset-manifest reconciliation;
- private review; and
- final Remotion composition.
