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
- Runtime proof profiles: `gpu_worker_ai_graphics`, `sam2`, `birefnet`, and
  `real_esrgan`.

## Command

Default fail-closed check:

```bash
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight
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

Both roots are local-only and must not be staged or committed.

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
- Agent can execute tools now: `false`
- Runtime ready now: `false`
- Internal beta ready now: `false`
- Production ready now: `false`

## Next Step

Fill reviewed private model-weight manifests locally, run the GPU runtime proof
command plan on an approved native NVIDIA L4 runtime, capture all four result
JSON files under `.local-artifacts`, then rerun this preflight with
`--require-ready-for-owner-review`.
