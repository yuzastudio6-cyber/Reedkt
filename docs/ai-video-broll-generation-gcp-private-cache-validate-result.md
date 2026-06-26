# AI Video B-roll Generation GCP Private Cache Validate Result

Decision: `ai_video_broll_gen_9j_cache_validate_private_diffusers_cache_and_runner_envelope_validated_ready_for_vm_preflight`

AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE validated the private Diffusers-format Wan 1.3B cache and the committed fail-closed runner envelope without creating a VM and without inference. The private cache hashes match the committed manifest, `model_index.json` declares `WanPipeline`, text encoder and transformer shard indexes resolve to local shards, and the runner validates a safe local Diffusers marker envelope while refusing execution fail-closed.

This gate ran the runner only in `--validate-only` mode with safe local temp paths under `/tmp/reeditpro-private-model-cache`, `/tmp/reeditpro-private-proof-output`, and `/tmp/reeditpro-private-hf-home`. It did not pass `--allow-approved-local-proof-execution`.

No dependency is installed, no model import is attempted, no pipeline is instantiated, no `from_pretrained` call is made, no `torch.load` is called, no text encoding runs, no denoising runs, no scheduler step runs, no VAE encode/decode runs, no inference runs, no generated frames or video are created, no VM is created, and no Google Cloud, Supabase, provider, worker, storage, signed URL, public artifact, credit, beta, or production path is touched.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-validate.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`

## Private Cache Validation

| Check | Result |
| --- | --- |
| Private cache path exists | yes |
| Source repository | `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` |
| Source commit | `0fad780a534b6463e45facd96134c9f345acfa5b` |
| Runtime-essential files | `19` |
| Aggregate bytes | `28928887859` |
| SHA-256 manifest verified | yes |
| `model_index.json` class | `WanPipeline` |
| Text encoder shard refs local and present | yes |
| Transformer shard refs local and present | yes |
| `.part` files present | no |
| AppleDouble `._*` sidecars present | no |
| `assets/*` downloaded | no |
| `examples/*` downloaded | no |
| Demos/screenshots/generated media downloaded | no |

## Runner Validate-Only Envelope

The runner requires model cache paths under `/tmp/reeditpro-private-model-cache`. To avoid copying the 27 GB private cache and to avoid bypassing the runner prefix guard, the validation used a tiny safe temp Diffusers marker mirror under the runner-approved prefix:

```text
/tmp/reeditpro-private-model-cache/cache-validate-diffusers-envelope
```

The temp mirror copied only the real `model_index.json` and created the Diffusers marker directories `transformer`, `vae`, and `scheduler`. The full private cache was validated separately by SHA-256 and shard index checks.

Runner command behavior:

- Environment required and supplied: `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, `DIFFUSERS_OFFLINE=1`, and `HF_HOME` under `/tmp/reeditpro-private-hf-home`.
- Fixture: `non-user-media-tabletop`.
- Max runtime cap: `60`.
- Execution flag: not supplied.
- Mode: `--validate-only`.
- Exit code: `78`.
- Status: `validated_but_execution_refused_fail_closed`.
- Cache layout: `diffusers_cache_layout`.
- Missing required marker files: none.
- `future_execution_flag_present`: false.
- `proof_execution_allowed_by_this_source`: false.
- `modelInferenceRun`: false.
- `generatedFramesCreated`: false.
- `generatedVideoCreated`: false.

## Runner Output Summary

```json ai-video-broll-gen-9j-cache-validate-runner-output
{
  "status": "validated_but_execution_refused_fail_closed",
  "runnerExitCode": 78,
  "runnerVersion": "ai-video-broll-gen-9j-runner-author-1",
  "cacheLayout": "diffusers_cache_layout",
  "runnableWithCurrentRunner": true,
  "missingRequiredFiles": [],
  "offlineEnvironmentOk": true,
  "futureExecutionFlagPresent": false,
  "proofExecutionAllowedByThisSource": false,
  "modelInferenceRun": false,
  "generatedFramesCreated": false,
  "generatedVideoCreated": false
}
```

## Result

```json ai-video-broll-gen-9j-cache-validate-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE",
  "decision": "ai_video_broll_gen_9j_cache_validate_private_diffusers_cache_and_runner_envelope_validated_ready_for_vm_preflight",
  "sourceBranch": "codex/ai-video-broll-gen-9j-diffusers-cache-download",
  "sourceCommit": "3796e236",
  "privateCacheValidation": {
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
    "modelRepository": "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
    "sourceCommit": "0fad780a534b6463e45facd96134c9f345acfa5b",
    "runtimeEssentialFileCount": 19,
    "aggregateBytes": 28928887859,
    "hashesVerified": true,
    "modelIndexClassName": "WanPipeline",
    "indexRefsLocal": true,
    "partialFilesRemaining": false,
    "appleDoubleSidecarsRemaining": false,
    "unexpectedFilesPresent": false
  },
  "runnerValidateOnly": {
    "run": true,
    "exitCode": 78,
    "status": "validated_but_execution_refused_fail_closed",
    "tempCachePath": "/tmp/reeditpro-private-model-cache/cache-validate-diffusers-envelope",
    "cacheLayout": "diffusers_cache_layout",
    "runnableWithCurrentRunner": true,
    "offlineEnvironmentOk": true,
    "futureExecutionFlagPresent": false,
    "proofExecutionAllowedByThisSource": false,
    "modelInferenceRun": false,
    "generatedFramesCreated": false,
    "generatedVideoCreated": false
  },
  "runtimeFlags": {
    "runnerValidateOnlyRun": true,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2: prepare controlled L4 private proof VM preflight, no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Docker container is built or started. No VM, disk, network, service account, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2: prepare controlled L4 private proof VM preflight, no inference`
