# Living Frame Controlled-Illustration Operation Preflight

Status: controlled and non-executable
Contract:
`living-frame-controlled-illustration-operation-preflight-v1`

## Outcome

This contract fixes the intended integration shape of the six
controlled-illustration capabilities without registering six fake tools or
creating another worker, queue, estimate, cost, or dispatch system.

| Capability | Placement | Production identity |
| --- | --- | --- |
| ComfyUI | one shared L4 GPU host | one future canonical host identity |
| `comfyui_controlnet_aux` | external control-image preparation | capability inside the approved recipe |
| ControlNet | model conditioning inside the shared host | mounted model artifact |
| IP-Adapter | reference conditioning inside the shared host | mounted model artifact |
| PEFT/LoRA | adapter loading inside the shared host | mounted adapter artifact |
| AuraFace | post-generation CPU continuity measurement | separate QA operation, never generation |

Only ComfyUI is expected to become the GPU-host tool identity. The other
entries are capabilities, dependencies, model artifacts, or a separate
measurement. A scene activates only the subset it needs.

## Required Canonical Seam

The future shared operation is named by a server-owned constant:

```text
tool = comfyui
operation = tool.comfyui.generate_controlled_image.v1
work item = generate_image_asset
worker = gpu_ai_worker
accelerator = one nvidia_l4
CPU fallback = forbidden
runtime model download = forbidden
```

Those identifiers are expectations, not released registry entries. The
current canonical registry is unchanged. Its observed identity count is not a
product cap; future count is derived from released distinct executable
identities. The operation remains non-executable
until the existing canonical authorities admit the tool identity, operation
spec, signed worker image, exact model-artifact requirement set, read-only
mounts, approved work projection, private dispatch, asset QA, and actual-cost
evidence.

## Cost Binding

The preflight binds the already implemented estimate semantics:

- ComfyUI, control-image preprocessing, ControlNet, IP-Adapter, and PEFT/LoRA
  share one `shared_controlled_illustration_gpu_host` estimate component;
- the shared GPU host is priced once for the bounded attempt, not once per
  capability;
- AuraFace adds a separate CPU continuity-measurement estimate only when
  identity continuity is required;
- planned usage is never an actual-cost receipt; and
- completed, failed, and unknown attempts must later retain measured
  infrastructure cost through the existing canonical attempt-cost evidence
  and settlement path.

Customer credit conversion, ReeditPro service fee, approval, reservation,
wallet mutation, and settlement remain owned by the canonical estimate and
commercial authorities.

## Lineage

The preflight is content-addressed and binds exact digests for:

- approved Living Frame lineage;
- selected-scene admission;
- component asset intent;
- confirmed output-frame expectation;
- MasterTiming expectation;
- controlled-illustration qualification v2;
- controlled source observation v2;
- customer estimate projection; and
- work-graph projection.

It does not copy or reinterpret any of those authorities.

## Open Gates

All of these remain closed:

1. canonical ComfyUI tool identity;
2. canonical ComfyUI operation spec;
3. signed GPU worker image;
4. dependency lock and SBOM;
5. operation-owned model-artifact requirements;
6. canonical read-only model mounts;
7. approved `generate_image_asset` work projection;
8. private GPU dispatch and lease;
9. actual attempt-cost evidence; and
10. generated component asset QA.

The smoke re-signs adversarial packets and proves that capability reordering,
AuraFace placement inside the GPU host, six fabricated production tool IDs,
the superseded PuLID candidate, caller-selected provider data, and forged
all-green authority fail closed.
