# Canonical ComfyUI GPU Runtime Source And Router

Status: source-complete, non-E2E candidate. This boundary does not claim a
released image, mounted model bundle, Cloud Run L4 execution, generated
artifact, customer charge, or production admission.

## One operation, one attempt

The canonical candidate identity is `comfyui`, and the only controlled image
operation is:

`tool.comfyui.generate_controlled_image.v1`

ComfyUI, `comfyui_controlnet_aux`, ControlNet, generic IP-Adapter, and
PEFT/LoRA are capabilities inside one supervised GPU process. They are not
five production tools and are not five billable attempts. AuraFace remains a
separate optional CPU continuity-QA boundary.

The released production registry remains at its existing 50 identities.
`comfyui` is recorded only in the non-E2E capability catalog while its release
evidence is incomplete. Registry count is observational rather than a
permanent product cap; a genuinely distinct released executable can be added
later through the canonical registry owner.

## Fixed source and package closure

The source tree under `docker/prod/gpu-worker/comfyui` pins:

- 35 hashed wheels totaling 486,459,097 bytes;
- ComfyUI revision `093d571b83e7a79833200e199b46b9f5a62217f9`;
- ComfyUI IP-Adapter Plus revision
  `b188a6cb39b512a9c6da7235b880af42c78ccd0d`;
- `comfyui_controlnet_aux` revision
  `e8b689a513c3e6b63edc44066560ca5919c0576e`;
- a no-index, no-dependency, require-hashes installation;
- a fixed model-path projection and post-install layout verifier;
- a fixed one-shot Python runner.

The runner accepts no caller command, environment, model path, URL, model
choice, output path, credential, or arbitrary graph node. It starts one
loopback-only ComfyUI host, denies top-level `sam2` imports for this operation,
executes one allowlisted API graph, captures exactly one
`SaveImageWebsocket` PNG, and shuts the host down.

## Exact model closure

Every request binds all five read-only canonical objects for the entire
attempt:

| Role | File | Bytes |
| --- | --- | ---: |
| SDXL base | `sd_xl_base_1.0.safetensors` | 6,938,078,334 |
| ControlNet | `diffusion_pytorch_model.fp16.safetensors` | 320,237,179 |
| LoRA | `sd_xl_offset_example-lora_1.0.safetensors` | 49,553,604 |
| IP-Adapter | `ip-adapter_sdxl.safetensors` | 702,585,376 |
| CLIP Vision | `model.safetensors` | 3,689,912,664 |

Total: 11,700,367,157 bytes.

The runner re-hashes the five files before starting ComfyUI and again only
after inference and host shutdown. Optional graph capabilities may leave an
object unused, but cannot replace, omit, or rename any mounted object.

## Selected-scene request boundary

The canonical request carries exact approved-snapshot, selected-scene,
work-item, planned-manifest, confirmed-frame, dispatch, prompt-graph, model,
and private-input lineage. It supports:

- exact 1024×1024 isolated-component generation; and
- confirmed full-frame dimensions from 256 through 4096 per axis, divisible by
  eight, with at most 8,294,400 pixels.

This replaces the old benchmark-only assumption that every request is
1024×1024. ComfyUI produces an opaque still input; it never owns the final
canvas. Remotion remains the final compositor. Isolated opaque outputs still
require the existing rembg/Sharp alpha chain. Full-frame outputs still require
continuity, fact, destination-composite, manifest, and private-review gates.

## Runtime and result boundary

The canonical GPU router now recognizes the one ComfyUI operation and
revalidates the current source contract and five model identities before
invoking a process-bound, single-use runtime port. The fixed subprocess port
uses only:

- `/opt/reeditpro/gpu-operations/comfyui/venv/bin/python`
- `-I -B`
- `/opt/reeditpro/gpu-operations/comfyui/runner.py`

A successful wire result must attest one NVIDIA L4 CUDA device, the exact
pinned sources, all five model objects verified before and after inference,
one opaque PNG matching the request dimensions, and one gracefully stopped
supervised host. The serializable result contains digests and measurements,
not prompt text or image/model bytes.

Wire verification is structural and lineage-bound. It is not a canonical
worker receipt, completion receipt, artifact commit, QA approval, cost
receipt, or production admission.

## Current evidence and open gates

Source validation and controlled router adversarial coverage are green. A
previous local model-free candidate image demonstrated non-root,
read-only-root, no-network startup and the pinned Python/Torch/CUDA package
shape.

The frozen private-local evidence at commit
`03b8a562de899e5776b1b70366e328b4ece392e4` also mounted all five exact
objects simultaneously, reread and hashed all 11,700,367,157 bytes, rejected
write-open and incomplete-set attempts, and observed ordered bundle digest
`cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20`.
That run was confined under UID/GID 65532 with a read-only root, no network,
all capabilities dropped, and no-new-privileges.

The local run used Apple-hosted Linux CPU emulation, deliberately stopped at
the CUDA-required boundary, did not load a ComfyUI graph, and produced no
image. It therefore proves the exact private-local bytes and atomic read-only
mount shape, not canonical artifact ingest, distributed mount presentation,
released-image identity, or L4 inference.

The following remain required:

1. materialize the exact offline wheel/source build inputs;
2. build, independently scan, sign, and admit the current source image;
3. ingest the already-observed exact five-model bundle through the canonical
   artifact repository and present it through the distributed read-only mount
   authority;
4. complete model-license, compatibility, and paid-use review;
5. run a real one-request/one-output NVIDIA L4 attempt;
6. record canonical worker, completion, resource-usage, and internal-cost
   evidence;
7. privately re-read and create-only persist the PNG;
8. complete the applicable alpha, continuity, fact, destination, manifest,
   scene-evidence, and private-review gates;
9. only then decide executable registry and dispatch admission.

Until those gates pass, dispatch, inference, artifact, cost, billing, public
delivery, and production authority remain false.
