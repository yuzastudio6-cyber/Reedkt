# AI Video B-roll Generation GCP Private Proof Runner Author Result

Decision: `ai_video_broll_gen_9j_runner_author_fail_closed_runner_authored_blocked_cache_layout_reconciliation`

AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR adds the committed fail-closed private L4 proof runner source approved by AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP. The runner validates the future proof envelope, rejects unsafe paths and values, requires offline mode, refuses execution by default, and blocks before model work when the cache is not an approved runnable layout.

This gate did not create a VM, disk, network, service account, key, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, Docker container, dependency install, model import, pipeline instance, model inference, generated frame, generated video, media artifact, FFmpeg output, Supabase row, SQL mutation, provider call, worker job, storage upload, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runner-author.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md`
- `docs/ai-video-broll-generation-controlled-dependency-install-result.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

## Runner Source

| Field | Result |
| --- | --- |
| Runner path | `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py` |
| Runner created | yes |
| Default behavior | validates and refuses execution |
| Heavy imports at module load | no |
| Future model imports | local to guarded future execution function |
| VM created | no |
| Dependency install run | no |
| Model import run | no |
| Inference run | no |
| Generated frames/video | no |

## Runner Contract Implemented

- Requires `--offline-model-cache`, `--fixture`, `--max-runtime-minutes`, `--output-dir`, and `--evidence-json`.
- Preserves approved model ID `Wan-AI/Wan2.1-T2V-1.3B` and revision `37ec512624d61f7aa208f7ea8140a131f93afc9a`.
- Requires fixture `non-user-media-tabletop`.
- Requires offline environment values `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, `DIFFUSERS_OFFLINE=1`, and `HF_HOME` under `/tmp/reeditpro-private-hf-home`.
- Restricts model cache paths to `/tmp/reeditpro-private-model-cache`.
- Restricts output and evidence paths to `/tmp/reeditpro-private-proof-output`.
- Rejects URL-shaped values, signed URL markers, credential-shaped values, service-account key paths, user media strings, customer data strings, and raw chat/prompt payload markers.
- Refuses execution unless a future gate passes `--allow-approved-local-proof-execution`.
- Still refuses execution when the current cache layout is original Wan runtime-essential layout instead of a runnable Diffusers cache layout.

## Cache Layout Result

The runner can classify the current cache as `original_wan_runtime_essential_cache` when these files are present:

- `config.json`
- `diffusion_pytorch_model.safetensors`
- `Wan2.1_VAE.pth`
- `models_t5_umt5-xxl-enc-bf16.pth`
- `google/umt5-xxl/spiece.model`
- `google/umt5-xxl/tokenizer.json`

That classification is not directly runnable by the guarded Diffusers path. A future gate must either:

1. approve and implement an adapter for the original Wan cache layout without cloning source repositories; or
2. approve a private Diffusers-format cache conversion/download lane for the exact Wan 1.3B revision.

## Result

```json ai-video-broll-gen-9j-runner-author-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR",
  "decision": "ai_video_broll_gen_9j_runner_author_fail_closed_runner_authored_blocked_cache_layout_reconciliation",
  "sourceBranch": "codex/ai-video-broll-gen-9j-runtime-setup-proof-runner",
  "sourceCommit": "9d56136f",
  "runner": {
    "path": "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py",
    "created": true,
    "failClosedDefault": true,
    "validatesEnvelope": true,
    "requiresOfflineEnvironment": true,
    "rejectsUnsafeValues": true,
    "rejectsUnapprovedFixture": true,
    "rejectsUnapprovedModelId": true,
    "rejectsUnapprovedRevision": true,
    "restrictsModelCachePrefix": "/tmp/reeditpro-private-model-cache",
    "restrictsOutputPrefix": "/tmp/reeditpro-private-proof-output",
    "topLevelTorchImport": false,
    "topLevelDiffusersImport": false,
    "topLevelTransformersImport": false,
    "networkDownloadCodePresent": false,
    "providerCallCodePresent": false,
    "supabaseSqlCodePresent": false,
    "workerDispatchCodePresent": false,
    "ffmpegCodePresent": false,
    "mediaEncodingCodePresent": false
  },
  "cacheLayout": {
    "currentApprovedCacheLayout": "original_wan_runtime_essential_cache",
    "diffusersCacheLayoutProven": false,
    "runnerCanExecuteCurrentCacheNow": false,
    "cacheLayoutReconciliationRequired": true,
    "futureOptions": [
      "approved_original_wan_cache_adapter",
      "approved_diffusers_format_cache_conversion_or_download"
    ]
  },
  "runtimeFlags": {
    "vmCreated": false,
    "diskCreated": false,
    "networkCreated": false,
    "serviceAccountCreated": false,
    "firewallRuleCreated": false,
    "gcpMutatingCommandsExecuted": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT: reconcile private Wan cache layout for approved runner, no VM/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No VM, disk, network, service account, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT: reconcile private Wan cache layout for approved runner, no VM/no inference`
