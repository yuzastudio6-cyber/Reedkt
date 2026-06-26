# AI Video B-roll Wan No-Inference Mount Validator

## Status

Decision: `ai_video_broll_wan_mount_validator_authored_no_model_import`

This packet adds a no-inference Wan/Wan2.1 mount/layout validator at `server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py`. The validator inspects path prefixes and expected layout markers only. It does not import model packages, hash large model files, run inference, copy weights, mount paths, create generated video, create assets, call providers, dispatch workers, touch Supabase, run SQL, mutate GCP, run Docker, unlock beta, or unlock production.

## Validator Scope

- Approved model: `Wan-AI/Wan2.1-T2V-1.3B`
- Approved source revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Canonical production-style prefix: `/opt/reeditpro/model-weights/ai-video-broll`
- Controlled proof cache prefix: `/tmp/reeditpro-private-model-cache`

## Layout Outcomes

- `missing_mount`: allowed prefix but path does not exist.
- `original_wan_runtime_essential_cache`: original Wan runtime-essential file layout is present, but the current proof runner still needs a future adapter or Diffusers-format cache before execution.
- `diffusers_cache_layout`: Diffusers marker layout is present; runnable only when all required markers are present.
- `unknown_cache_layout`: allowed prefix exists but does not match the required layouts.
- `disallowed_path` or `invalid_input`: path is outside approved prefixes or contains forbidden value shapes.

## No-Import Guarantee

The validator source must not import `torch`, `diffusers`, `transformers`, `accelerate`, `safetensors`, or `huggingface_hub`. The diagnostic compiles the Python source and executes only synthetic temporary layout checks with empty placeholder files.

## Runtime Gates

- modelWeightsCopiedNow: false
- modelMountCreatedNow: false
- dependencyInstalledNow: false
- sourceRepositoryClonedNow: false
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

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-5: run no-inference Wan mount validator on approved private cache, no model import`
