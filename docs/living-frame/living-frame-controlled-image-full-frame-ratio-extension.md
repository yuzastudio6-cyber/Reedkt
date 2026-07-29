# Living Frame controlled-image full-frame ratio extension

Status date: 2026-07-29

Status:
`full_frame_ratio_units_projected_operation_qualification_pending`

This namespaced server contract extends the selected-scene controlled-image
request for source stills and background plates whose generation canvas must
match the approved output frame. It is a qualification projection, not an
executable ComfyUI request, operation registration, worker dispatch, asset
creation, final render, or production promotion.

## Frame ownership

The extension rereads the canonical confirmed output frame from the same plan
components used by the approved selected-scene lineage. It recomputes the
frame-expectation digest and rejects any mismatch.

It supports:

- confirmed portrait `9:16`;
- confirmed landscape `16:9`; and
- confirmed custom or other non-square ratios within the bounded
  qualification envelope.

Width and height are derived only from that canonical confirmed frame. The
caller cannot provide replacement dimensions. An unconfirmed frame, a ratio
label that disagrees with the frame dimensions, or a substituted square canvas
fails closed.

The current qualification envelope is:

```text
minimum dimension: 512 pixels
maximum dimension: 4096 pixels
maximum pixel count: 8,294,400
```

These are controlled qualification ceilings, not a provider promise or
production SLO.

## Full-frame and isolated-component separation

The extension applies only to:

- `source_still`;
- `opaque_background_plate`; and
- `reconstructed_background_plate`.

Each matching selected-scene unit produces one derived full-frame ratio unit
with the exact confirmed output-frame dimensions.

The server-private selected-scene prompt materializer now consumes that unit
when compiling the actual private ComfyUI API-format prompt. It copies the
verified width and height exactly into `EmptyLatentImage`; it does not accept
caller dimensions and does not use the benchmark prompt materializer. See
`docs/living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization.md`.

Isolated subjects and other separable components remain on the independently
bounded `isolated_component_square_1024` path. The extension records those
units but cannot mutate them. It therefore never turns one full-frame request
into multiple component requests or silently changes a component-generation
budget.

## Canvas ownership

ComfyUI produces a still source or background plate. It does not produce the
final video canvas.

Every derived unit requires:

```text
generated still
  -> existing still alpha path where needed
  -> component and continuity QA
  -> canonical asset manifest
  -> private review
  -> Remotion final composition
```

The extension prohibits a re-signed claim that ComfyUI owns the final canvas.
It also prohibits AI video fallback for these controlled still requests.

## One host attempt

The extension preserves the fixed controlled-generation boundary:

- one `comfyui` host identity;
- one candidate operation,
  `tool.comfyui.generate_controlled_image.v1`;
- one selected-scene request unit per attempt;
- one image per attempt;
- one fixed supervised Python process per attempt;
- the exact five-model atomic read-only mount lifetime;
- before-and-after model verification;
- operation-scoped denial of `sam2`;
- the frozen confinement digest; and
- no caller command, arguments, environment, path, URL, credential, model
  choice, or seed.

ComfyUI, `comfyui_controlnet_aux`, ControlNet, generic IP-Adapter, and
PEFT/LoRA remain roles within the same supervised GPU attempt and cost event.
AuraFace remains separate optional CPU continuity QA.

## Semantic registry policy

The current production-tool count is observational and is not a product cap.
Registry expansion is permitted when a new canonical identity is a genuinely
distinct executable tool/runtime with its own operation, security, cost, QA,
fallback, and released-evidence boundary.

Model weights, adapters, libraries, and capabilities inside the shared
ComfyUI attempt do not become fake tool identities. AuraFace may receive a
distinct released CPU-QA identity only if its independent boundary justifies
one. Therefore the post-admission count is derived from released distinct
identities, not fixed in this extension.

The pre-existing canonical Living Frame estimate/work/asset projection still
contains a temporary exact-count runtime guard. The backend one-writer must
replace that implementation detail with semantic uniqueness/readiness
validation before any registry expansion. This namespaced extension records
that open gate and does not mutate the shared path.

## Adversarial rejection

The smoke fixture proves rejection of:

- an unconfirmed output frame;
- a ratio-label/dimension mismatch;
- caller-supplied dimensions;
- non-square-to-square substitution;
- a ComfyUI final-canvas claim;
- raw prompt injection;
- filesystem/model-path leakage;
- relaxation of the `sam2` denial or atomic mount lifetime;
- reintroduction of a fixed registry cap; and
- cross-scene or work-item substitution.

## Remaining gates

The extension leaves all operation, registry, routing, approved dispatch,
worker lease, runtime, persistence, actual cost, billing, asset-manifest,
private review, final render, and production authorities false.

The downstream private materializer preserves the same boundary. Its
process-bound lease is a prompt/request capability only, not a canonical
worker lease or dispatch capability.

Before promotion, the backend still requires:

- canonical ComfyUI identity and operation admission;
- a fixed supervised-process entrypoint in the shared runtime contract;
- a signed, scanned, non-root image;
- license, vulnerability, dependency, and model-weight disposition;
- exact `11,700,367,157`-byte five-model read-only mount evidence;
- real NVIDIA L4 full-frame memory, latency, and output evidence;
- canonical resource and actual-cost receipts;
- create-only asset persistence;
- alpha, continuity, fact, and destination-composite QA;
- private review; and
- final Remotion composition evidence.
