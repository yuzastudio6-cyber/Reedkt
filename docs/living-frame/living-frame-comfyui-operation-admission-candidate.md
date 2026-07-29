# Living Frame ComfyUI operation admission candidate

Status date: 2026-07-29

Status:
`semantic_registry_policy_recorded_release_evidence_pending`

This contract freezes the exact backend decision required to move the
controlled Living Frame image host from evaluation metadata toward one
canonical executable operation. It does not modify the production tool
registry, register an operation, dispatch a worker, or authorize production.

## One operation, not six tools

The six controlled-illustration capabilities are:

1. ComfyUI;
2. `comfyui_controlnet_aux`;
3. ControlNet;
4. generic IP-Adapter;
5. PEFT/LoRA; and
6. optional AuraFace continuity measurement.

They do not become six new production tool identities. The proposed canonical
edit operation is exactly:

```text
tool: comfyui
operation: tool.comfyui.generate_controlled_image.v1
work item: generate_image_asset
worker: gpu_ai_worker
accelerator: one NVIDIA L4
```

ComfyUI hosts the first five capabilities inside one GPU attempt. AuraFace
remains separate, optional CPU post-generation QA. The production registry may
expand to 51, 60, or more identities when a new identity represents a
genuinely distinct executable tool/runtime with its own operation, security,
cost, QA, fallback, and released-evidence boundary. The current observed count
is not a product cap.

For this controlled generation attempt, ComfyUI,
`comfyui_controlnet_aux`, ControlNet, generic IP-Adapter, and PEFT/LoRA
remain capabilities within one supervised GPU host lifetime and one cost
attempt. They must not become fake tool identities. AuraFace may receive a
distinct CPU-QA identity only if its independent boundary and released
evidence justify one. Therefore the post-admission count is derived from the
distinct identities actually released; this candidate intentionally asserts
no future count and changes no shared registry file.

One pre-existing shared-interface conflict remains: the canonical Living Frame
estimate/work/asset projection still contains a temporary exact-count runtime
guard. The backend one-writer must replace that implementation detail with
semantic uniqueness/readiness validation before any registry expansion. This
candidate records the conflict but does not mutate the shared projection.

## Request boundary

The caller-facing canonical tool request must contain:

- the approved immutable snapshot;
- the approved work item;
- the current credit estimate and active reservation;
- the opaque worker lease;
- the idempotency key;
- the selected-scene controlled-image request binding and its digest;
- the output-frame expectation digest;
- the exact model-manifest ID; and
- at most two private input-image artifact bindings.

It must not contain raw chat, raw prompt text, filesystem paths, URLs,
commands, arguments, environment, credentials, or caller-selected model
identities.

The exact five model roles total `11,700,367,157` bytes and must resolve
through the canonical model manifest plus released read-only model mounts.
They must not be forced through the generic per-request artifact-binding byte
ceiling. The current GPU protocol proves benchmark request materialization,
but a benchmark request must never substitute for a selected-scene production
request. The server-derived selected-scene request projection now binds the
approved snapshot, scene, component, continuity, output-frame, estimate,
pending work, and expected-output lineage without including raw conditioning
text. The canonical operation must still consume that binding from the
approved work item before dispatch.

## Entrypoint gap

The controlled host is not an arbitrary Python import or caller-selected
binary. It runs through the fixed supervised Python process contract, with:

- fixed source and custom-node roots;
- exact loopback binding;
- one process per attempt;
- no caller arguments or environment;
- no external listen;
- no runtime downloads;
- the operation-scoped `sam2` import guard;
- read-only root and source/model/input mounts;
- UID/GID `65532:65532`;
- dropped Linux capabilities;
- `no-new-privileges`; and
- isolated ephemeral write roots.

The generic production operation entrypoint union currently supports
`node_library`, `python_library`, and `fixed_binary`. It does not express this
fixed supervised-process boundary. The backend owner must add or deliberately
map an exact entrypoint form without weakening the existing supervisor.

## QA and output

The immediate generated PNG must pass asset-integrity QA. It still cannot
reach final export by itself. The existing Living Frame pipeline owns:

- generated-source integrity;
- alpha and edge QA when the still becomes a component;
- requested continuity review;
- identity, documentary, and factual safety;
- destination-composite legibility;
- asset-manifest reconciliation;
- private review; and
- final Remotion composition.

No parallel QA, renderer, timing, approval, or asset-manifest system is
created.

## Cost and fallback

One operation request is one shared GPU attempt for ComfyUI, ControlNet,
generic IP-Adapter, LoRA, and any deterministic external control image used by
that request. AuraFace remains separately attributable optional CPU QA.

The worker records actual internal resource cost only. It cannot calculate
customer credits, add the ReeditPro service fee, mutate a wallet, or settle a
charge.

AI video is not a fallback for this still-image operation. A simpler approved
still, existing asset, or separately approved provider-still route may be
used only when the approved snapshot and estimate permit it.

## Current outcome

The candidate is digest-bound to the current offline package source contract,
fixed launch spec, locked dependency manifest, and exact denied import set.
It fails closed if the current registry state changes before the backend
owner consumes it.

The remaining release gates include canonical admission, approved-work-item
operation binding for each selected-scene request, a signed/scanned non-root
image, direct-VCS dependency disposition, released confinement observation,
distributed model mounts, license/commercial-use approval, private L4
execution evidence, actual worker resource cost, generated-asset QA, private
review, fallback proof, and backend one-writer reconciliation of the shared
exact-count guard.

The namespaced full-frame ratio extension now derives controlled qualification
units for confirmed `16:9`, `9:16`, and custom source-still/background-plate
frames. It preserves isolated-component `1024 × 1024` requests, prohibits
square substitution, and keeps Remotion as the final canvas owner. This closes
the planning contract gap only; full-frame GPU memory/latency/output-quality
evidence and every operation, dispatch, persistence, QA, review, and
production gate remain open.

The selected-scene private prompt materializer now binds that ratio extension
to the real selected-scene request, not the benchmark path. It emits one
process-bound single-use private prompt-request lease per approved generated
output and a byte-free lineage receipt. This closes prompt materialization
only. It does not consume the candidate as an admitted production operation,
does not dispatch, and does not alter any canonical registry, routing, work,
cost, manifest, approval, render, or review owner.
