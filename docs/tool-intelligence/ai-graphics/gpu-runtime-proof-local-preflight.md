# AI Graphics GPU Runtime Proof Local Preflight

Decision: `ai_graphics_gpu_runtime_proof_local_preflight_prepared_with_manifest_and_result_blocks`

This packet adds a local-only preflight that joins the two missing GPU/model
evidence inputs for the eight AI graphics GPU tools:

- reviewed private model-weight manifest records
- native NVIDIA GPU runtime proof result JSON files

The preflight does not run Docker, execute GPU runtime, download model weights,
load checkpoints, run inference, process media, call Tool Routes, queue Workers,
call providers, create artifacts, or unlock beta/production.

## Scope

- GPU/runtime-targeted tools: `torch_torchvision`, `transformers`, `sam2`,
  `birefnet`, `real_esrgan`, `kornia`, `rembg`, and
  `transparent_background`.
- Manifest-required tools: `sam2`, `birefnet`, `real_esrgan`, `rembg`, and
  `transparent_background`.
- Runtime proof profiles: `gpu_worker_ai_graphics`, `sam2`, `birefnet`,
  `real_esrgan`, `rembg`, and `transparent_background`.

## Command

Default fail-closed check:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight
```

Detect whether the current host can produce the native GPU proof:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- \
  --detect-host \
  --require-host-eligible
```

With local private manifests and native GPU proof results:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- \
  --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests \
  --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results \
  --require-ready-for-owner-review
```

## Local Evidence Roots

- Model manifests: `.local-artifacts/ai-graphics/model-weight-manifests`
- GPU proof results: `.local-artifacts/ai-graphics/gpu-runtime-proof-results`
- Private model-weight root env: `REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT`

Both roots are local-only and must not be staged or committed.
The private model-weight root env value must stay local-only; generated command
plans reference the variable name, not the private path.

## Host Eligibility

Native GPU proof must run on a native `linux/amd64` host with Docker targeting
`linux/amd64`, an available Docker NVIDIA runtime, and `nvidia-smi` reporting an
NVIDIA GPU. Apple Silicon, CPU-only Docker, emulated Linux, and hosts without
the NVIDIA container runtime must fail the `--require-host-eligible` preflight.

## GPU Runtime Activation Policy

The preflight accepts only exact GPU targets for the eight GPU/model tools:
`torch_torchvision`, `transformers`, `kornia`, `rembg`, and
`transparent_background` use `native_linux_amd64_nvidia_l4_gpu_worker`; `sam2`
uses `native_linux_amd64_nvidia_l4_sam2_runtime`; `birefnet` uses
`native_linux_amd64_nvidia_l4_birefnet_runtime`; and `real_esrgan` uses
`native_linux_amd64_nvidia_l4_real_esrgan_runtime`.

GPU runtime is on-demand only. The proof containers are ephemeral
`docker run --rm --gpus all` commands and must not be kept as idle resident GPU
services. They can start only for an approved native proof command or a future
approved Worker/Tool Route handoff. CPU fallback remains disallowed for the
heavy/model tools when a GPU runtime proof or runtime call is required.

## Current Public State

- PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/862
- Draft: `true`
- Merge state: `CLEAN`
- Head: `19a23c29bedbc456b9a2c2de57dc1063a8226efa`
- Check rollup: empty
- Manifest input status: `missing_private_manifests`
- Proof result input status: `missing_native_gpu_runtime_proof_results`
- Model manifests ready for GPU proof: `false`
- Native GPU proof results accepted for owner review: `false`
- All GPU runtime evidence ready for owner review: `false`
- GPU runtime targets exact: `true`
- GPU runtime on-demand only: `true`
- Idle GPU runtime approved: `false`
- CPU fallback allowed for heavy/model tools: `false`
- Host check mode: `not_requested`
- Host eligible for native GPU proof: `false`
- Agent can execute tools now: `false`
- Runtime ready now: `false`
- Internal beta ready now: `false`
- Production ready now: `false`

## Next Step

Fill reviewed private model-weight manifests locally, run the GPU runtime proof
command plan, generate the local-only runner script at
`.local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh`,
run that script only on an approved native NVIDIA L4 runtime, capture all six
result JSON files under `.local-artifacts`, then rerun this preflight with
`--require-ready-for-owner-review`.
