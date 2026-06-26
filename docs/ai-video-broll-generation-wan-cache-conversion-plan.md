# AI Video B-roll Wan Original-Cache Adapter / Diffusers Conversion Plan

## Status

Decision: `ai_video_broll_wan_cache_conversion_plan_ready_no_copy_no_import`

This packet adds a no-copy conversion planner for the already validated Wan/Wan2.1 private cache. It recommends the next safe path as an original-cache adapter contract before any model import. It does not copy model weights, create a Diffusers cache, create symlinks, install dependencies, import model packages, run inference, create generated video, create generated assets, start a VM, run Docker, mutate GCP, call providers, dispatch workers, touch Supabase, run SQL, upload storage, create signed URLs, create public artifacts, mutate credits, unlock beta, or unlock production.

## Source Cache State

- Model: `Wan-AI/Wan2.1-T2V-1.3B`
- Source revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Source cache path: `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Source layout: `original_wan_runtime_essential_cache`
- Missing required files: none
- Current proof-runner runnable: false

## Original Cache Adapter Inputs

- `config.json`
- `diffusion_pytorch_model.safetensors`
- `Wan2.1_VAE.pth`
- `models_t5_umt5-xxl-enc-bf16.pth`
- `google/umt5-xxl/spiece.model`
- `google/umt5-xxl/tokenizer.json`

## Options

| Option | Status | Why |
| --- | --- | --- |
| `original_cache_adapter` | future owner review required | Best next implementation because it avoids copying or reformatting the controlled cache and can be validated before model import. |
| `diffusers_cache_materialization` | future owner review required | Possible later, but requires copy/symlink/materialization policy, component layout source of truth, checksum preservation, cleanup, and private retention review. |
| `defer_until_vm_mount` | safe default | Keeps all execution blocked, but does not make the proof runner runnable. |

## Recommended Path

Recommended option: `original_cache_adapter`

The next implementation should author a no-inference adapter contract that maps the original Wan runtime-essential files to the future runner expectations without loading weights or importing model packages.

## Future Diffusers Layout Requirements

- `model_index.json`
- `transformer/`
- `vae/`
- `scheduler/`
- `tokenizer/`
- `text_encoder/`

These are future materialization requirements only. This packet does not create them.

## Runtime Gates

- modelWeightsCopiedNow: false
- diffusersCacheCreatedNow: false
- symlinksCreatedNow: false
- dependencyInstalledNow: false
- modelImportsRun: false
- modelInferenceRun: false
- generatedVideoCreated: false
- generatedAssetsCreated: false
- vmCreated: false
- dockerRun: false
- gcpMutationCreated: false
- providerCallsMade: false
- workersDispatched: false
- supabaseTouched: false
- sqlExecuted: false
- storageUploaded: false
- signedUrlsCreated: false
- publicArtifactsCreated: false
- creditMutationCreated: false
- betaUnlocked: false
- productionUnlocked: false

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-8: author no-inference Wan original-cache adapter contract, no model import`
