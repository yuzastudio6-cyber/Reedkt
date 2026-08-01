# Living Frame controlled SDXL artifact candidate set

Status: controlled upstream metadata observation, non-promotable and
non-executable.

This contract closes one ambiguity in the controlled-illustration route: it
defines one internally coherent SDXL candidate bundle for the existing
ComfyUI graph slots. It does not download, install, mount, dispatch, or run
the models.

## Why this bundle exists

The earlier family contract correctly selected
`stable_diffusion_xl_base_1_0` and `clip_vision_vit_big_g_14`, but the broad
tool-qualification inventory still referenced the historical ControlNet v1.1
collection associated with Stable Diffusion 1.5. A syntactically valid graph
is not enough. Every base checkpoint, ControlNet checkpoint, LoRA, generic
IP-Adapter checkpoint, and CLIP Vision checkpoint must name the same
compatible family before artifact ingestion or GPU execution can be
considered.

The candidate set uses these immutable upstream revisions observed on
2026-07-28:

- [`stabilityai/stable-diffusion-xl-base-1.0`](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/tree/462165984030d82259a11f4367a4eed129e94a7b)
  at `462165984030d82259a11f4367a4eed129e94a7b`;
- [`diffusers/controlnet-canny-sdxl-1.0-small`](https://huggingface.co/diffusers/controlnet-canny-sdxl-1.0-small/tree/edd85f64c5f87dfb6d73762949d9daca16389518)
  at `edd85f64c5f87dfb6d73762949d9daca16389518`; and
- [`h94/IP-Adapter`](https://huggingface.co/h94/IP-Adapter/tree/018e402774aeeddd60609b4ecdb7e298259dc729)
  at `018e402774aeeddd60609b4ecdb7e298259dc729`.

## Exact observed artifact metadata

| Graph role | Upstream artifact | Reported bytes | Reported LFS SHA-256 | Controlled interpretation |
| --- | --- | ---: | --- | --- |
| Base checkpoint | [`sd_xl_base_1.0.safetensors`](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/462165984030d82259a11f4367a4eed129e94a7b/sd_xl_base_1.0.safetensors) | 6,938,078,334 | `31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b` | SDXL 1.0 monolithic base candidate |
| ControlNet checkpoint | [`diffusion_pytorch_model.fp16.safetensors`](https://huggingface.co/diffusers/controlnet-canny-sdxl-1.0-small/blob/edd85f64c5f87dfb6d73762949d9daca16389518/diffusion_pytorch_model.fp16.safetensors) | 320,237,179 | `fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9` | Small experimental canny ControlNet whose model card names SDXL 1.0 |
| LoRA adapter | [`sd_xl_offset_example-lora_1.0.safetensors`](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/462165984030d82259a11f4367a4eed129e94a7b/sd_xl_offset_example-lora_1.0.safetensors) | 49,553,604 | `4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f` | Co-located SDXL example only; behavior remains unbenchmarked |
| Generic IP-Adapter | [`sdxl_models/ip-adapter_sdxl.safetensors`](https://huggingface.co/h94/IP-Adapter/blob/018e402774aeeddd60609b4ecdb7e298259dc729/sdxl_models/ip-adapter_sdxl.safetensors) | 702,585,376 | `ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6` | Generic non-FaceID SDXL adapter paired with bigG |
| CLIP Vision checkpoint | [`sdxl_models/image_encoder/model.safetensors`](https://huggingface.co/h94/IP-Adapter/blob/018e402774aeeddd60609b4ecdb7e298259dc729/sdxl_models/image_encoder/model.safetensors) | 3,689,912,664 | `657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d` | OpenCLIP ViT-bigG-14 image encoder named by the IP-Adapter model card |

The total reported artifact size is 11,700,367,157 bytes. That total is a
capacity-planning signal, not a storage receipt or cost authority.

## Evidence strength

The process-bound reader replays exact immutable repository revisions,
artifact codes, LFS-reported sizes and SHA-256 values, model-card digests, and
license-label observations. The output deliberately says:

- the upstream blob metadata was observed;
- ReeditPro did not fetch all artifact bytes;
- the reported SHA-256 values were not independently recomputed from full
  downloaded objects;
- safetensors schemas were not inspected;
- no object exists in the canonical model-artifact repository;
- no compatibility or quality benchmark passed; and
- paid production use remains unapproved.

The candidate therefore cannot satisfy the existing canonical
model-artifact binding yet. That binding still requires server-owned
locators and full repository checksum verification.

## License and model-card boundary

The SDXL base and selected ControlNet repositories label their model cards
`openrail++`. The generic IP-Adapter repository labels its model card
`apache-2.0`. Those are dated upstream labels, not legal conclusions.
Combining artifacts does not erase the base-model terms, training-data
questions, use restrictions, attribution duties, or the GPL deployment
review for the ComfyUI IP-Adapter extension.

The small ControlNet candidate calls itself experimental. It remains useful
as a lower-storage compatibility candidate, but it cannot become the default
professional route until quality and fallback benchmarks pass.

The LoRA is present in the exact SDXL base repository, but co-location alone
does not prove correct runtime behavior. Exact key/schema inspection and a
controlled visual benchmark remain required.

## Face and identity boundary

The candidate contains no FaceID, InsightFace, AuraFace generation adapter,
or real-person likeness route. AuraFace remains a separate continuity-QA
measurement capability. Generic IP-Adapter reference conditioning must still
use an approved project asset and applicable consent, rights, identity,
minor-safety, privacy, retention, and documentary-safety policies.

## Remaining gates

Before model execution:

1. independently retrieve and recompute every full artifact checksum;
2. ingest all five objects through the canonical model-artifact repository;
3. inspect exact safetensors schemas and model-family keys;
4. benchmark the complete pinned ComfyUI, ControlNet, LoRA, IP-Adapter, and
   CLIP Vision bundle;
5. complete license and paid-production-use review;
6. admit the exact artifact set to the shared GPU operation;
7. bind a selected scene, immutable approved snapshot, admitted work,
   dispatch attempt, internal cost evidence, asset manifest, and QA plan; and
8. pass private review.

No provider, tool route, registry entry, worker, queue, approval, runtime, or
production authority is granted by this candidate set.
