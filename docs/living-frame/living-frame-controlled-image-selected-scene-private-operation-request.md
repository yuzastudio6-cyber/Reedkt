# Living Frame selected-scene private operation request

Status date: 2026-07-29

Status:
`selected_scene_private_operation_request_lease_created_dispatch_blocked`

`living-frame-controlled-image-selected-scene-private-operation-request-v1`
is the server-only bridge from one exact approved selected-scene prompt
materialization unit to one private, non-dispatched ComfyUI operation request.
It is not the compatibility-benchmark GPU request path and it does not
register, dispatch, execute, persist, charge, approve, review, or render
anything.

## Exact one-output boundary

The compiler accepts exactly one materialization unit and its real
process-bound prompt-request lease:

```text
one approved generated work item/output
  -> one selected-scene request unit
  -> one selected-scene prompt materialization unit
  -> one consumed prompt-request lease
  -> one private operation-request lease
  -> at most one future supervised GPU attempt
```

The unit is rebound to the current:

- selected scene and Visual Continuity Pack;
- immutable approved snapshot;
- MasterTiming digest;
- canonical work graph;
- exact approved generated work item and output key;
- exact planned asset-manifest entry;
- controlled-illustration cost/work binding;
- confirmed output-frame expectation;
- full-frame ratio extension when applicable;
- selected-scene prompt materialization;
- non-executable ComfyUI admission candidate; and
- server-owned current artifact packet.

Scene, request-unit, component, work-item, output, asset-manifest, timing,
snapshot, ratio, prompt, or cost-lineage substitutions fail closed.

## Artifact and graph binding

Every private request binds exactly five canonical model artifacts in canonical
order:

1. SDXL base checkpoint;
2. ControlNet checkpoint;
3. LoRA adapter;
4. generic IP-Adapter checkpoint; and
5. CLIP Vision checkpoint.

Their exact aggregate size remains `11,700,367,157` bytes. All five are
present even when the selected graph uses only a subset, because they share
one atomic read-only mount lifetime. A used model alias must appear exactly
once in the prompt. An unused model alias must not appear in the prompt.

The operation packet may additionally bind only the exact approved external
input images required by the selected graph:

- zero or one deterministic ControlNet image prepared outside ComfyUI; and
- zero or one approved generic IP-Adapter continuity reference.

The packet cannot introduce FaceID, InsightFace, an in-graph preprocessor,
arbitrary save/preview nodes, caller-selected models, or a benchmark recipe.

## Confirmed dimensions

The operation request takes dimensions only from the verified materialization
unit:

- isolated components remain exactly `1024 × 1024`;
- source stills and background plates use the exact confirmed full-frame
  extension dimensions; and
- the current landscape fixture remains exactly `1920 × 1080`.

The caller cannot supply or override dimensions. A non-square full-frame plate
cannot be replaced with `1024 × 1024`. ComfyUI produces one opaque PNG input
asset; it never owns the final video canvas. Remotion remains the final
composition owner.

## Private request and artifact ports

Current model and input-image artifacts enter through a process-bound,
server-created reader. It:

- accepts one server-owned locator;
- is consumed once;
- rejects caller packets, bytes, aliases, prompts, seeds, dimensions, model
  choices, paths, URLs, credentials, commands, and environment;
- returns a digest-protected current packet; and
- creates no repository, mount, operation, dispatch, runtime, or cost
  authority.

After packet validation, the real prompt lease is consumed exactly once. The
resulting private operation request remains process-local behind a second
single-use lease. The serializable receipt includes only lineage, dimensions,
digests, counts, byte lengths, artifact metadata, and explicit non-authority
flags. It excludes raw prompt text, private aliases, paths, URLs, model or
image bytes, credentials, commands, environment, seeds, prices, credits,
service fees, reservations, wallets, and ledgers.

## Fixed supervised runtime policy

Every future attempt remains bound to:

- one fixed supervised Python process;
- the frozen runtime-confinement digest;
- non-root UID/GID policy;
- read-only root filesystem;
- all Linux capabilities dropped;
- no-new-privileges;
- external network blocked;
- runtime downloads blocked;
- exact five-model atomic read-only mount;
- before-and-after verification for every model;
- `sam2` and `sam2.*` denied;
- one websocket PNG output; and
- one process and one output per attempt.

No caller command, argument, environment, path, URL, endpoint, or credential
can enter the request.

## One identity and one cost attempt

The request expects one future canonical identity and operation:

```text
comfyui
tool.comfyui.generate_controlled_image.v1
```

ComfyUI, `comfyui_controlnet_aux`, ControlNet, generic IP-Adapter, and LoRA
remain capability roles within one supervised GPU attempt and one actual
attempt-cost event. They are not five tool identities or five charges.
AuraFace remains outside the GPU attempt and may become a separate CPU-QA
identity only if its independent released runtime, security, cost, QA, and
fallback boundary warrants it.

The registry count remains semantic. The current observed count is not a cap;
51, 60, or more identities are allowed only for genuinely distinct released
executables. Model weights, adapters, libraries, preprocessors, and internal
capabilities do not become fake identities.

## Deliberately closed authority

The contract keeps all of these false:

- canonical operation registration;
- production-tool selection;
- provider routing;
- queue or dispatch authority;
- canonical worker lease;
- GPU attempt creation;
- runtime execution;
- resource or actual-cost receipt creation;
- customer estimate, price, credit, or billing authority;
- generated-asset persistence;
- asset-manifest mutation;
- QA approval;
- private-review approval;
- final-canvas ownership; and
- production readiness.

The approved snapshot, MasterTiming, work graph, estimate, asset manifest,
Remotion canvas, QA, billing, and private review retain their existing
canonical owners.

## Adversarial coverage

The smoke fixture covers both a `1920 × 1080` full-frame plate and a
`1024 × 1024` isolated component. It rejects:

- unconfirmed or substituted frame lineage;
- full-frame square substitution;
- caller seed, dimensions, prompt, model, path, URL, bytes, credentials,
  command, or environment;
- benchmark-case substitution;
- cross-scene, cross-work-item, cross-output, and cross-manifest substitution;
- missing, reordered, duplicated, size-mismatched, or alias-mismatched model
  artifacts;
- missing or substituted input images;
- relaxed confinement, external network, runtime download, atomic mount, or
  `sam2` policy;
- copied, reused, or foreign process-bound readers and leases;
- raw private data in the receipt;
- final-canvas claims; and
- operation, dispatch, runtime, cost, asset, approval, or production
  promotion.

## Exact shared-interface conflict

The existing
`LivingFrameControlledSdxlPrivateGpuWireRequest` and the current canonical
mount-host runner input are benchmark-oriented and type their output width and
height as literal `1024`. They therefore cannot consume a selected-scene
full-frame request such as `1920 × 1080` without an unsafe cast or square
substitution.

This namespaced contract intentionally does not mutate those shared runtime
interfaces while the backend one-writer boundary is active. Before execution
can be admitted, the canonical backend owner must reconcile that interface by
introducing a selected-scene-capable wire envelope or a safely generalized
dimension contract while keeping:

- the compatibility benchmark frozen;
- the exact five-model canonical mount checks;
- the fixed supervised entrypoint and confinement digest;
- the `sam2` denial;
- one-request/one-attempt semantics; and
- all canonical dispatch, cost, asset, and QA owners unchanged.

This conflict blocks execution integration, not the non-executable request
candidate delivered here.

## Remaining release gates

The candidate remains blocked on:

- semantic reconciliation of the shared registry compatibility guard;
- canonical ComfyUI identity and operation admission;
- the shared wire-interface reconciliation described above;
- a signed, scanned, dependency-locked, non-root image;
- licensing, vulnerability, dependency, and model-weight disposition;
- exact atomic read-only model distribution and mount evidence;
- real NVIDIA L4 memory, latency, determinism, and quality evidence;
- canonical private dispatch and worker leases;
- canonical resource and actual-cost receipts;
- create-only generated-asset persistence;
- alpha, continuity, factual, and destination-composite QA;
- asset-manifest reconciliation;
- private review; and
- final Remotion composition.
