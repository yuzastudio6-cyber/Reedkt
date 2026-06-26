# AI Video B-roll Wan Original-Cache Adapter Contract

## Status

Decision: `ai_video_broll_wan_original_cache_adapter_contract_ready_no_model_import`

This packet adds a no-inference adapter contract for the already validated Wan/Wan2.1 private cache. It maps the original Wan runtime-essential cache files to future proof-runner expectations without importing model packages, copying weights, creating a Diffusers cache, creating symlinks, reading large weight contents, running inference, creating generated video, creating generated assets, starting a VM, running Docker, mutating GCP, calling providers, dispatching workers, touching Supabase, running SQL, uploading storage, creating signed URLs, creating public artifacts, mutating credits, unlocking beta, or unlocking production.

## Source Cache State

- Model: `Wan-AI/Wan2.1-T2V-1.3B`
- Source revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Source cache path: `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Source layout: `original_wan_runtime_essential_cache`
- Missing required files: none
- Recommended conversion option: `original_cache_adapter`
- Adapter status: `future_owner_review_required`
- Adapter allowed now: false
- Valid for no-inference review: true

## Adapter Input Mapping

| Original file | Adapter role | Materialization class | Current action |
| --- | --- | --- | --- |
| `config.json` | `pipeline_config_metadata` | `metadata_only` | Check presence and size metadata only. |
| `diffusion_pytorch_model.safetensors` | `transformer_diffusion_weight` | `future_model_weight` | Check presence and size metadata only. |
| `Wan2.1_VAE.pth` | `vae_weight` | `future_model_weight` | Check presence and size metadata only. |
| `models_t5_umt5-xxl-enc-bf16.pth` | `text_encoder_weight` | `future_model_weight` | Check presence and size metadata only. |
| `google/umt5-xxl/spiece.model` | `tokenizer_sentencepiece_model` | `future_tokenizer_asset` | Check presence and size metadata only. |
| `google/umt5-xxl/tokenizer.json` | `tokenizer_json` | `future_tokenizer_asset` | Check presence and size metadata only. |

## Future Runtime Requirements

- Approved adapter implementation inside the proof runner.
- No-auto-download guards before any runtime import.
- Offline environment guards before any runtime import.
- GPU quota and VM/runtime owner acceptance.
- Pre-import adapter validation.
- Private proof output and QA evidence.

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

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-9: integrate Wan original-cache adapter validation into proof runner, no model import`
