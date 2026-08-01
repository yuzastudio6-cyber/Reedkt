# Living Frame ComfyUI five-model local mount internal test

Status: exact private-local bundle mount verified; real L4 load and generation
remain required.

Run:

```text
npm run smoke:living-frame-comfyui-five-model-local-mount-internal-test
```

## Outcome

The bounded internal test uses the exact locked local ComfyUI candidate and a
fixed, no-argument preflight entrypoint. It mounts all five controlled SDXL
artifacts simultaneously:

1. SDXL 1.0 base checkpoint;
2. SDXL canny ControlNet;
3. the controlled offset LoRA candidate;
4. generic SDXL IP-Adapter; and
5. the paired CLIP Vision checkpoint.

Inside one container lifetime, the entrypoint independently rereads and hashes
all `11,700,367,157` bytes. The observed ordered bundle digest is:

```text
cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20
```

Every artifact matched its exact canonical role, byte length, and SHA-256.
Every file was an individual read-only bind mount and a write-open attempt was
rejected.

| Role | Bytes | SHA-256 |
| --- | ---: | --- |
| Base checkpoint | 6,938,078,334 | `31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b` |
| ControlNet | 320,237,179 | `fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9` |
| LoRA | 49,553,604 | `4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f` |
| Generic IP-Adapter | 702,585,376 | `ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6` |
| CLIP Vision | 3,689,912,664 | `657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d` |

## Confinement

The derived Linux `amd64` container uses:

- default UID/GID `65532:65532`;
- a fixed Python entrypoint;
- no caller command or arguments;
- a scrubbed fixed environment;
- `--network none`;
- a read-only root;
- all capabilities dropped;
- no-new-privileges;
- bounded CPU, memory, PIDs, and no-exec temporary storage;
- the fixed `sam2` top-level import denial; and
- exactly five read-only model mounts.

Adversarial runs prove rejection of caller arguments, a root identity
override, and an incomplete four-of-five mount set.

## Honest CUDA boundary

The exact Torch `2.5.1+cu124` and TorchVision `0.20.1+cu124` runtime observes
no CUDA device under Apple-hosted Linux emulation. After verifying the entire
bundle, the entrypoint exits with the fixed CUDA-required status `78`.

The test does not:

- load the five models into a ComfyUI graph;
- start the ComfyUI loopback host;
- submit a prompt;
- execute GPU inference;
- create an output image;
- dispatch `tool.comfyui.generate_controlled_image.v1`;
- create cost or customer-credit evidence;
- persist an artifact;
- approve QA or private review; or
- grant public or production authority.

The remaining controlled-generation internal gate is:

1. build and sign the canonical current ComfyUI image;
2. present the same five exact artifacts through the distributed canonical
   read-only mount authority;
3. load the complete reviewed graph on a real NVIDIA L4;
4. run the approved selected-scene request with the server-owned seed;
5. capture one private output and canonical resource receipt; and
6. pass alpha/continuity/fact-safety/artifact/private-review QA.

ComfyUI, ControlNet auxiliary support, ControlNet, generic IP-Adapter, and
LoRA remain capabilities inside one supervised GPU attempt and one cost event.
No additional tool identity or charge is created.

## Files

- `docker/prod/gpu-worker/comfyui/Dockerfile.local-five-model-mount-candidate`
- `docker/prod/gpu-worker/comfyui/local-five-model-mount-entrypoint.py`
- `src/types/living-frame-comfyui-five-model-local-mount-evidence.ts`
- `server/living-frame/living-frame-comfyui-five-model-local-mount-evidence.ts`
- `server/smoke/living-frame-comfyui-five-model-local-mount-internal-test-smoke.ts`
