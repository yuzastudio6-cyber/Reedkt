# AI Video B-roll Generation GCP Private Proof Cache Layout Decision

Decision: `ai_video_broll_gen_9j_cache_layout_diffusers_private_cache_lane_approved_ready_for_private_download_proof`

AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT reconciles the cache layout blocker from the fail-closed private L4 proof runner. The selected path is a separate private Diffusers-format cache download proof for `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`, pinned to commit `0fad780a534b6463e45facd96134c9f345acfa5b`. The original Wan runtime-essential cache remains valid provenance evidence but is not the runnable cache for the committed `WanPipeline` runner.

This gate does not download model weights, create a VM, install dependencies, transfer a cache, import a model, instantiate a pipeline, run inference, generate frames, generate video, encode media, mutate Google Cloud, touch Supabase, call providers, dispatch workers, or claim `dry_run_passed` or `generated_local_fixture_passed`.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-layout.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- Hugging Face API metadata for `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`
- Hugging Face Diffusers Wan docs: https://huggingface.co/docs/diffusers/v0.33.1/api/pipelines/wan
- Wan model card: https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B-Diffusers

## Decision

| Option | Decision | Reason |
| --- | --- | --- |
| Adapter for current original Wan runtime-essential cache | rejected for this lane | Would require custom original-layout loading or source-repo runtime code that has not been approved. |
| Private Diffusers-format cache conversion/download | approved as next no-VM proof | Aligns with committed `WanPipeline` runner and official Diffusers layout. |
| Runtime network fetch on VM | rejected | Runner must remain offline-only. |
| Public bucket or signed URL transfer | rejected | Private local/VM transfer only; signed URLs are never source of truth. |

## Diffusers Source Metadata

Read-only metadata inspection found:

- Model repository: `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`.
- Pinned commit: `0fad780a534b6463e45facd96134c9f345acfa5b`.
- Last modified: `2025-04-04T02:28:36.000Z`.
- Sibling count: `31`.
- `model_index.json` class: `WanPipeline`.
- `model_index.json` components: `UniPCMultistepScheduler`, `UMT5EncoderModel`, `T5TokenizerFast`, `WanTransformer3DModel`, `AutoencoderKLWan`.
- Transformer index total size: `5675987200` bytes across two shards.
- Text encoder index total size: `22723641344` bytes across five shards.

## Required Runtime-Essential Diffusers Files

The next private download proof must fetch only the runtime-essential Diffusers files, not assets, examples, screenshots, demos, or repository art:

```text
model_index.json
scheduler/scheduler_config.json
text_encoder/config.json
text_encoder/model-00001-of-00005.safetensors
text_encoder/model-00002-of-00005.safetensors
text_encoder/model-00003-of-00005.safetensors
text_encoder/model-00004-of-00005.safetensors
text_encoder/model-00005-of-00005.safetensors
text_encoder/model.safetensors.index.json
tokenizer/special_tokens_map.json
tokenizer/spiece.model
tokenizer/tokenizer.json
tokenizer/tokenizer_config.json
transformer/config.json
transformer/diffusion_pytorch_model-00001-of-00002.safetensors
transformer/diffusion_pytorch_model-00002-of-00002.safetensors
transformer/diffusion_pytorch_model.safetensors.index.json
vae/config.json
vae/diffusion_pytorch_model.safetensors
```

Explicitly not needed for runtime proof:

```text
.gitattributes
README.md
assets/*
examples/*
```

## Private Cache Target

The next gate should download into this outside-repo private cache path:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b
```

The cache must remain outside git and must not be uploaded, exposed by signed URL, or copied into a public artifact.

## Checksum Plan

The next private download proof must:

- fetch files only from the pinned Hugging Face source commit;
- avoid recording signed redirect URLs;
- compute SHA-256 for every downloaded file;
- record byte size for every downloaded file;
- record aggregate bytes from the actual downloaded file set;
- verify `model_index.json` still names `WanPipeline`;
- verify transformer and text encoder index files reference only local shards inside the same cache;
- remove AppleDouble sidecar files from the private cache;
- not import the model or call `from_pretrained`.

The checksum manifest created by the next gate must supersede the old original-layout aggregate byte field for the runner proof lane.

## Runner Compatibility

The committed fail-closed runner already classifies a Diffusers cache as runnable when these markers exist:

```text
model_index.json
transformer/
vae/
scheduler/
```

After the Diffusers-format cache download proof, the runner can validate the cache layout without network fetches. A later VM proof still must repeat all GCP, quota, cost, cache, and cleanup preflights before execution.

## Still Blocked

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

```json ai-video-broll-gen-9j-cache-layout-decision
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT",
  "decision": "ai_video_broll_gen_9j_cache_layout_diffusers_private_cache_lane_approved_ready_for_private_download_proof",
  "sourceBranch": "codex/ai-video-broll-gen-9j-runner-author",
  "sourceCommit": "51e25169",
  "selectedCacheLayout": {
    "decision": "private_diffusers_format_cache_download_proof",
    "originalWanCacheAdapterApproved": false,
    "diffusersPrivateCacheLaneApproved": true,
    "runtimeNetworkFetchAllowed": false,
    "modelRepository": "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
    "sourceCommit": "0fad780a534b6463e45facd96134c9f345acfa5b",
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
    "downloadedNow": false,
    "modelImportedNow": false,
    "runnerCanExecuteAfterDownloadProof": true
  },
  "metadataEvidence": {
    "metadataOnlyNetworkInspectionRun": true,
    "modelIndexClassName": "WanPipeline",
    "modelIndexDiffusersVersion": "0.33.0.dev0",
    "componentClasses": [
      "UniPCMultistepScheduler",
      "UMT5EncoderModel",
      "T5TokenizerFast",
      "WanTransformer3DModel",
      "AutoencoderKLWan"
    ],
    "siblingCount": 31,
    "runtimeEssentialFileCount": 19,
    "transformerShardCount": 2,
    "transformerTotalSizeBytes": 5675987200,
    "textEncoderShardCount": 5,
    "textEncoderTotalSizeBytes": 22723641344
  },
  "runtimeFlags": {
    "modelWeightDownloadRun": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD: download private Diffusers-format Wan cache, no VM/no inference"
}
```

## No-Scope Statement

No model weights are downloaded. No dependency is installed. No virtual environment is created. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No VM, disk, network, service account, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD: download private Diffusers-format Wan cache, no VM/no inference`
