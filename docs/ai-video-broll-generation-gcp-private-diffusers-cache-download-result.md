# AI Video B-roll Generation GCP Private Diffusers Cache Download Result

Decision: `ai_video_broll_gen_9j_diffusers_cache_download_private_cache_hashed_ready_for_cache_validate`

AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD downloaded the approved runtime-essential Diffusers-format Wan 1.3B files into the private outside-repo model cache. The cache is pinned to `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` at commit `0fad780a534b6463e45facd96134c9f345acfa5b`.

This gate downloaded model weight files only into the approved private cache path. It did not create a VM, install dependencies, import `torch`, import `diffusers`, import `transformers`, instantiate a pipeline, call `from_pretrained`, run the fail-closed runner, run inference, generate frames, generate video, run FFmpeg, mutate Google Cloud, touch Supabase, execute SQL, call providers, dispatch workers, upload storage, create signed URLs, create public artifacts, mutate credits, or claim beta/production readiness.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-diffusers-cache-download.md`
- `docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`

## Approved Source And Target

| Field | Value |
| --- | --- |
| Source repository | `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` |
| Source commit | `0fad780a534b6463e45facd96134c9f345acfa5b` |
| Private cache path | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b` |
| Runtime-essential files downloaded | `19` |
| Aggregate bytes | `28928887859` |
| `model_index.json` class | `WanPipeline` |
| Text encoder index refs local | yes |
| Transformer index refs local | yes |
| AppleDouble sidecars removed | yes |

## Download Notes

- The first transfer attempt completed the small config files and text encoder shards `model-00001` and `model-00002`.
- The first attempt hit a transient HTTP/2 stream cancel while transferring `text_encoder/model-00003-of-00005.safetensors`.
- The second attempt resumed from the partial shard using HTTP/1.1 and completed the full runtime-essential file set.
- The proof did not record signed redirect URLs, credentials, or provider tokens.
- The proof did not fetch `assets/*`, `examples/*`, repository art, screenshots, demos, or generated media.

## Validation Summary

- Every runtime-essential file exists at the private cache path.
- Every runtime-essential file has a recorded byte size and SHA-256.
- `model_index.json` declares `WanPipeline`.
- `text_encoder/model.safetensors.index.json` references the five local text encoder shards only.
- `transformer/diffusion_pytorch_model.safetensors.index.json` references the two local transformer shards only.
- No `.part` files remain in the private cache.
- No AppleDouble `._*` sidecar files remain in the private cache after cleanup.

## Runtime And Safety Gates

The cache is ready for a later no-VM runner-envelope validation gate, but this gate does not authorize execution.

Still blocked:

- VM creation.
- Dependency installation.
- Model import.
- `WanPipeline.from_pretrained`.
- `torch.load`.
- Text encoding, denoising, scheduler, VAE encode/decode, or inference.
- Generated frames or generated video.
- Media encoding or FFmpeg.
- Google Cloud mutation.
- Supabase or SQL.
- Provider calls.
- Worker dispatch.
- Storage upload.
- Signed URL creation.
- Public artifact creation.
- Credit mutation.
- Beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claims.

## Result

```json ai-video-broll-gen-9j-diffusers-cache-download-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD",
  "decision": "ai_video_broll_gen_9j_diffusers_cache_download_private_cache_hashed_ready_for_cache_validate",
  "sourceBranch": "codex/ai-video-broll-gen-9j-cache-layout",
  "sourceCommit": "635078a0",
  "download": {
    "modelRepository": "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
    "sourceCommit": "0fad780a534b6463e45facd96134c9f345acfa5b",
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
    "runtimeEssentialFileCount": 19,
    "aggregateBytes": 28928887859,
    "modelIndexClassName": "WanPipeline",
    "textEncoderIndexRefsLocal": true,
    "transformerIndexRefsLocal": true,
    "appleDoubleSidecarsRemoved": true,
    "partialFilesRemaining": false,
    "assetsDownloaded": false,
    "examplesDownloaded": false,
    "signedRedirectUrlsRecorded": false
  },
  "runtimeFlags": {
    "modelWeightFilesDownloadedToPrivateCache": true,
    "dependencyInstallRun": false,
    "modelImportRun": false,
    "pipelineInstantiated": false,
    "modelFromPretrainedCalled": false,
    "torchLoadCalled": false,
    "textEncodingRun": false,
    "denoisingStepRun": false,
    "schedulerRun": false,
    "vaeEncodeDecodeRun": false,
    "modelInferenceRun": false,
    "generatedFramesCreated": false,
    "generatedVideoCreated": false,
    "mediaProcessingRun": false,
    "ffmpegRun": false,
    "runnerExecuted": false,
    "vmCreated": false,
    "gcpMutatingCommandsExecuted": false,
    "providerCalled": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageUploaded": false,
    "signedUrlsCreated": false,
    "publicArtifactsCreated": false,
    "creditMutationCreated": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE: validate Diffusers cache with fail-closed runner envelope, no VM/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No fail-closed runner is executed. No Docker container is built or started. No VM, disk, network, service account, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE: validate Diffusers cache with fail-closed runner envelope, no VM/no inference`
