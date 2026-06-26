# Qwen2.5-VL 7B Storage Transfer URL-list Result

## Status

Decision: `qwen2_5_vl_7b_storage_transfer_url_list_completed_private_cache_no_deploy_no_inference`

This packet records the one-time Storage Transfer URL-list execution that completed the private Cloud Storage model-cache prefix for `Qwen/Qwen2.5-VL-7B-Instruct` revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`.

The completed private cache is evidence for the next Cloud Run GPU mount/readiness review only. It does not deploy Cloud Run, create a Cloud Run service, create a Cloud Run job, build Docker, push Docker, create Artifact Registry images, create VMs, create reservations, import Qwen on GPU, load model weights into a runtime, run inference, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No GPU instance or Cloud Run GPU service is running from this packet.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-fix.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Local private cache at `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Google Storage Transfer URL-list guide: https://cloud.google.com/storage-transfer/docs/create-url-list
- Google Storage Transfer REST `transferJobs.create`: https://cloud.google.com/storage-transfer/docs/reference/rest/v1/transferJobs/create
- Google Storage Transfer `TransferSpec`: https://cloud.google.com/storage-transfer/docs/reference/rest/v1/TransferSpec

## Transfer Preconditions Verified

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Destination bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Destination bucket location | `US-CENTRAL1` |
| Storage Transfer API enabled | true |
| Storage Transfer service agent | `project-390722338345@storage-transfer-service.iam.gserviceaccount.com` |
| Stable Hugging Face source URLs used | true |
| Redirected signed CDN URLs written to repo | false |
| URL-list hosted publicly | false |
| URL-list hosted privately in GCS | true |
| URL-list rows | `16` |
| URL-list size column used | true |
| Helper files excluded | `aggregate_checksum_sha256.txt`, `file_checksums_sha256.txt`, `file_sizes.txt` |

The source URL checks used stable pinned Hugging Face resolve URLs only. A header check confirmed `config.json` reported the pinned revision, content length, and range support. The large shard header check confirmed content length and range support through the stable resolve path, but this packet does not record redirected signed CDN URL tokens.

## IAM And API Changes

| Area | Result |
| --- | --- |
| Storage Transfer API enabled | true |
| Project service-agent role added | `roles/storagetransfer.serviceAgent` |
| Bucket legacy reader role added for service agent | `roles/storage.legacyBucketReader` |
| Prefix-scoped object admin condition added | `qwen25vl_storage_transfer_objects` |
| Temporary bucket-level object creator added | true |
| Temporary bucket-level object creator removed | true |
| Service account key file created | false |
| Secret Manager read performed | false |
| Public principal granted | false |

The temporary `roles/storage.objectCreator` binding was required because Storage Transfer job creation validates destination object-create permission at bucket scope even though the final operation used prefix-scoped transfer paths. That temporary member was removed after the transfer and cleanup completed. The remaining Qwen-specific conditional object-admin binding is scoped to the approved model prefix and transfer-list/test prefixes.

## Naming Test

| Area | Result |
| --- | --- |
| Test URL-list object | `naming-test-20260626T225007Z.tsv` |
| Test file | `config.json` |
| Test expected bytes | `1374` |
| Test operation | `transferOperations/transferJobs-qwen25vl-naming-test-never-20260626t225007z-6954846680659839547` |
| Test job status after cleanup | `DISABLED` |
| Test result | success |
| Test objects found | `1` |
| Test objects copied | `1` |
| Test bytes copied | `1374` |
| URL-derived destination naming observed | true |
| Test staging object cleaned up | true |
| Test URL-list object cleaned up | true |

The naming test confirmed Storage Transfer writes URL-list objects under a host/path-derived object name at the sink. The full transfer therefore used a temporary private staging prefix, followed by a controlled Cloud Storage copy into the exact approved model-cache prefix.

## Full Transfer Result

| Area | Result |
| --- | --- |
| Full URL-list object | `full-20260626T225355Z.tsv` |
| Full transfer job | `transferJobs/qwen25vl-full-transfer-20260626t225355z` |
| Full transfer operation | `transferOperations/transferJobs-qwen25vl-full-transfer-20260626t225355z-16735982338150561186` |
| Operation status | `SUCCESS` |
| Source objects found | `16` |
| Objects copied to staging | `16` |
| Bytes copied to staging | `16595981281` |
| Failed source objects | `0` |
| Staging prefix copied to final prefix | true |
| Final prefix object count | `16` |
| Final prefix total bytes | `16595981281` |
| Expected object count | `16` |
| Expected total bytes | `16595981281` |
| Full transfer job status after cleanup | `DELETED` |
| Full staging objects cleaned up | true |
| Full URL-list object cleaned up | true |

## Final Private Cache Inventory

Approved prefix:

```text
gs://reeditpro-staging-reeditpro-generated-assets/model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/
```

| Object | Bytes |
| --- | ---: |
| `.gitattributes` | `1519` |
| `README.md` | `18574` |
| `chat_template.json` | `1050` |
| `config.json` | `1374` |
| `generation_config.json` | `216` |
| `merges.txt` | `1671839` |
| `model-00001-of-00005.safetensors` | `3900233256` |
| `model-00002-of-00005.safetensors` | `3864726320` |
| `model-00003-of-00005.safetensors` | `3864726424` |
| `model-00004-of-00005.safetensors` | `3864733680` |
| `model-00005-of-00005.safetensors` | `1089994880` |
| `model.safetensors.index.json` | `57619` |
| `preprocessor_config.json` | `350` |
| `tokenizer.json` | `7031645` |
| `tokenizer_config.json` | `5702` |
| `vocab.json` | `2776833` |

Total: `16` objects, `16595981281` bytes.

## Runtime Interpretation

The private GCS cache is now complete enough for the next mount/readiness review:

- The approved private model-cache prefix contains all expected files.
- The expected object count and byte total match the controlled local manifest.
- The transfer avoided request-time model download from a future runtime.
- The transfer avoided GPU usage entirely.
- Temporary transfer-list and transfer-staging objects were cleaned up.
- The one-time full transfer job was deleted after success.

This packet does not prove Cloud Storage FUSE model-load compatibility, startup local-copy behavior, Cloud Run cold start, vLLM import on Cloud Run, CUDA visibility in Cloud Run, or inference quality. Those remain future gates.

## Runtime Gates

- `storageTransferUrlListResultCreated=true`
- `storageTransferApiEnabled=true`
- `storageTransferServiceAgentConfigured=true`
- `temporaryStorageTransferObjectCreatorCreated=true`
- `temporaryStorageTransferObjectCreatorRemoved=true`
- `urlListObjectCreated=true`
- `urlListObjectCleanedUp=true`
- `storageTransferNamingTestRun=true`
- `storageTransferNamingTestPassed=true`
- `storageTransferFullJobCreated=true`
- `storageTransferFullJobRun=true`
- `storageTransferFullJobPassed=true`
- `storageTransferFullJobDeleted=true`
- `cloudToCloudFinalPrefixCopyRun=true`
- `temporaryTransferStagingObjectsCleanedUp=true`
- `gcsObjectUploadComplete=true`
- `finalPrivateCacheObjectCount=16`
- `finalPrivateCacheTotalBytes=16595981281`
- `expectedPrivateCacheObjectCount=16`
- `expectedPrivateCacheTotalBytes=16595981281`
- `remoteByteSizeManifestMatched=true`
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

## Remaining Blockers

- No Cloud Run model-cache volume mount has been created.
- No Cloud Run service has been deployed.
- No Artifact Registry image has been built or pushed.
- No Cloud Storage FUSE read/import compatibility proof has run.
- No startup local-copy strategy has been proven.
- No vLLM or SGLang runtime has been started on Cloud Run.
- No model import, model load, inference, generated fixture, beta route, or production route is approved.
- No worker queue dispatch, approved snapshot execution, QA row, or credit gate has been used.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_21-CLOUD-RUN-GPU-PRIVATE-CACHE-MOUNT-VERIFY: verify completed private GCS model cache mount/read path, no deploy/no inference`
