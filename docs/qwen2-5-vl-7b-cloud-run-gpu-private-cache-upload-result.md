# Qwen2.5-VL 7B Cloud Run GPU Private Cache Upload Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_blocked_partial_no_deploy_no_inference`

This packet records the private model-cache upload execution attempt for Qwen2.5-VL 7B. The upload was attempted against the approved private staging bucket and revision prefix, but it did not complete because the large shard transfer was too slow for an interactive execution step and the resumed composite uploader did not finish before the attempt was stopped.

This packet does not claim that the private cache is complete. It does not deploy Cloud Run, create a Cloud Run service, create a Cloud Run volume mount, create IAM bindings, create service-account keys, build or push Docker images, create reservations or VMs, import Qwen, load Qwen, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No GPU instance or Cloud Run GPU service is running from this packet.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- local private cache at `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`

## Upload Target

| Area | Value |
| --- | --- |
| Project inspected | `reeditpro` |
| Bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Bucket location | `US-CENTRAL1` |
| Object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Expected model file count | `16` |
| Expected weight shard count | `5` |
| Expected total bytes | `16595981281` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |

## Local Manifest Verification

| Area | Result |
| --- | --- |
| Local cache outside git worktree | true |
| Controlled model payload files | `16` |
| Local helper files excluded from upload | `aggregate_checksum_sha256.txt`, `file_checksums_sha256.txt`, `file_sizes.txt` |
| Local expected total bytes | `16595981281` |
| Local expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Local manifest accepted for upload attempt | true |

## Remote Inventory Result

The intended model prefix currently contains only six small metadata/tokenizer-support files:

| Object | Bytes |
| --- | ---: |
| `.gitattributes` | `1519` |
| `README.md` | `18574` |
| `chat_template.json` | `1050` |
| `config.json` | `1374` |
| `generation_config.json` | `216` |
| `merges.txt` | `1671839` |

| Area | Result |
| --- | --- |
| Remote object count at intended prefix | `6` |
| Remote total bytes at intended prefix | `1694572` |
| Expected complete object count | `16` |
| Expected complete total bytes | `16595981281` |
| Remote upload complete | false |
| Remote checksum fully verified | false |
| Remote aggregate SHA-256 recomputed | false |

The result does not treat existing `gcloud/tmp/parallel_composite_uploads/` objects as part of the Qwen model cache. Those temporary component objects are not final model objects under the approved model prefix and are not a readiness signal.

## Transfer Attempts

| Attempt | Tool | Result |
| --- | --- | --- |
| Small-file upload | `gcloud storage cp` | Six small objects uploaded to the approved prefix |
| Large shard normal upload | `gsutil cp` with parallel composite disabled | Stopped after slow progress on `model-00001-of-00005.safetensors`; no final shard object appeared at the intended prefix |
| Large shard composite upload | `gsutil cp` with parallel composite enabled | Stopped after slow progress on `model-00001-of-00005.safetensors`; no final shard object appeared at the intended prefix |
| Large shard resumed composite upload | `gcloud storage cp --no-clobber` | Stopped after the command remained incomplete; observed average throughput was about `4.7 MiB/s`; no final shard object appeared at the intended prefix |

## Outcome

| Area | Value |
| --- | --- |
| Upload attempted | true |
| Upload passed | false |
| Upload status | `blocked_partial` |
| Blocker | `large_shard_transfer_throughput_and_resumable_composite_completion` |
| Final shard objects created | false |
| Model cache ready for Cloud Run mount | false |
| Model import allowed | false |
| Inference allowed | false |
| Cloud Run deploy allowed | false |

## Runtime Gates

- `privateCacheUploadResultCreated=true`
- `gcsObjectUploadAttempted=true`
- `gcsObjectUploadPassed=false`
- `remoteObjectCount=6`
- `remoteTotalBytes=1694572`
- `remoteExpectedObjectCount=16`
- `remoteExpectedTotalBytes=16595981281`
- `remoteChecksumVerified=false`
- `remoteAggregateSha256Recomputed=false`
- `cloudRunVolumeMountCreated=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `artifactRegistryImageCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
- `dependencyInstallRun=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `apiServerStarted=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Required Follow-up

The next step should fix the upload path, not move to IAM, Cloud Run mount, import, inference, beta, or production. A future retry should choose an upload strategy that can either:

1. Complete all five large shards under the approved private prefix with resumable retry evidence; or
2. Use an approved server-side transfer path that avoids the local uplink bottleneck while preserving private storage, revision pinning, object counts, and checksum verification.

The future retry must re-list the intended prefix after completion and must not treat temporary composite objects as final model-cache files.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_19-FIX-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD: retry private cache upload with improved resumable transfer strategy, no deploy/no inference`
