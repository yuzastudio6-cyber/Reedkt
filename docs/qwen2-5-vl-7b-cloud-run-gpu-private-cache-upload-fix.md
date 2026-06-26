# Qwen2.5-VL 7B Cloud Run GPU Private Cache Upload Fix

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_fix_selects_cloud_side_transfer_no_deploy_no_inference`

This packet records the follow-up retry after the partial private-cache upload result. The local resumable upload retry still did not complete `model-00001-of-00005.safetensors`, and the approved model prefix remains partial. The selected fix is to stop relying on the local uplink for 16 GB model-weight transfer and move the next execution step to a cloud-side transfer path.

This packet does not complete the model upload, create a Storage Transfer job, create URL-list objects, deploy Cloud Run, create a Cloud Run service or job, create IAM bindings, create service-account keys, build or push Docker images, create reservations or VMs, import Qwen, load Qwen, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No GPU instance or Cloud Run GPU service is running from this packet.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-result.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Google Cloud Storage Transfer Service overview: https://docs.cloud.google.com/storage-transfer/docs/overview
- Google Cloud URL list transfer guide: https://docs.cloud.google.com/storage-transfer/docs/create-url-list
- Google Cloud Storage Transfer source/sink matrix: https://docs.cloud.google.com/storage-transfer/docs/sources-and-sinks

## Current Remote State

| Area | Value |
| --- | --- |
| Bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Bucket location | `US-CENTRAL1` |
| Intended object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Expected complete object count | `16` |
| Expected complete total bytes | `16595981281` |
| Current object count at intended prefix | `6` |
| Current total bytes at intended prefix | `1694572` |
| First large shard present | false |
| Model cache ready for Cloud Run mount | false |

The current intended prefix contains only these final model-cache objects:

| Object | Bytes |
| --- | ---: |
| `.gitattributes` | `1519` |
| `README.md` | `18574` |
| `chat_template.json` | `1050` |
| `config.json` | `1374` |
| `generation_config.json` | `216` |
| `merges.txt` | `1671839` |

Temporary composite upload objects under `gcloud/tmp/parallel_composite_uploads/` are not counted as model-cache objects and must not be mounted or imported.

## Follow-Up Local Retry Result

| Area | Result |
| --- | --- |
| Follow-up branch | `codex/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix` |
| Retry target | `model-00001-of-00005.safetensors` |
| Retry tool | `gcloud storage cp --no-clobber` |
| Retry mode | resumable parallel composite upload |
| Retry elapsed before stop | more than `13` minutes |
| Active network proof | not observed during final liveness check |
| Final shard object created | false |
| Intended prefix changed by retry | false |
| Local-uplink strategy accepted for next step | false |

## Selected Fix Strategy

Preferred next path: Storage Transfer Service URL-list transfer from official pinned Hugging Face resolve URLs into the existing private staging bucket and revision prefix.

Selected strategy token: `storage_transfer_url_list`.

Why this is preferred:

- It avoids the local Mac uplink bottleneck.
- It does not require GPU.
- It does not deploy the Qwen Cloud Run GPU service.
- It can run as a bounded one-time transfer operation.
- It preserves the private destination prefix and revision pinning.
- It keeps model import and inference blocked until the complete object count, bytes, and checksum policy are verified.

Storage Transfer Service supports transfers from publicly accessible URLs to Cloud Storage and accepts a TSV URL-list source. The future execution step must verify the URL-list access requirement and should not include signed URL tokens, provider credentials, or secrets in the URL list.

Fallback path if URL-list transfer cannot satisfy the safety/access rules: a one-shot Cloud Run CPU transfer runner that streams the 16 pinned public Hugging Face files into the private GCS prefix, verifies byte counts and SHA-256 while streaming, exits, and scales to zero. This fallback must not use GPU and must not be the Qwen inference service.

Fallback strategy token: `cloud_run_cpu_one_shot_transfer_runner`.

## Future URL List Shape

The future URL list must contain exactly the 16 controlled model payload files from revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`:

| File | Required |
| --- | --- |
| `.gitattributes` | true |
| `README.md` | true |
| `chat_template.json` | true |
| `config.json` | true |
| `generation_config.json` | true |
| `merges.txt` | true |
| `model-00001-of-00005.safetensors` | true |
| `model-00002-of-00005.safetensors` | true |
| `model-00003-of-00005.safetensors` | true |
| `model-00004-of-00005.safetensors` | true |
| `model-00005-of-00005.safetensors` | true |
| `model.safetensors.index.json` | true |
| `preprocessor_config.json` | true |
| `tokenizer_config.json` | true |
| `tokenizer.json` | true |
| `vocab.json` | true |

The future URL list must not include local helper files such as `aggregate_checksum_sha256.txt`, `file_checksums_sha256.txt`, or `file_sizes.txt`.

## Future Execution Preconditions

- Confirm active project is `reeditpro`.
- Confirm destination bucket exists in `US-CENTRAL1`.
- Confirm current prefix state is partial and same-revision only.
- Confirm URL-list entries resolve to the official Qwen Hugging Face model repository and pinned revision only.
- Confirm no signed URL tokens, private credentials, or bearer tokens are present.
- Confirm destination writes are only under the approved model prefix.
- Confirm overwrite behavior is safe for the six already-uploaded same-revision objects.
- Confirm transfer job is one-time and not recurring.
- Confirm model import, model load, inference, Cloud Run GPU deploy, and workers remain blocked.

## Runtime Gates

- `privateCacheUploadFixCreated=true`
- `localRetryAttempted=true`
- `localRetryPassed=false`
- `selectedNextTransferStrategy=storage_transfer_url_list`
- `fallbackNextTransferStrategy=cloud_run_cpu_one_shot_transfer_runner`
- `storageTransferJobCreated=false`
- `urlListObjectCreated=false`
- `cloudRunCpuTransferJobCreated=false`
- `cloudRunGpuServiceCreated=false`
- `gcsObjectUploadComplete=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_20-STORAGE-TRANSFER-URL-LIST-EXECUTE: complete private Qwen model cache with one-time Storage Transfer URL-list job, no deploy/no inference`
