# Qwen2.5-VL 7B Cloud Run GPU Private Mount Read Proof Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_mount_read_proof_passed_dedicated_bucket_no_model_import_no_inference`

This packet records a bounded Cloud Run private model-cache read proof for the fail-closed Qwen2.5-VL 7B GPU worker. The proof fixed the GCSFuse mount boundary by moving the pinned Qwen cache into a dedicated private model-cache bucket, then verified that a Cloud Run execution using the GPU worker service account can mount and read the private cache metadata without loading the model or running inference.

This packet does not import Qwen, load Qwen, run inference, send a runtime service request, call providers, dispatch production workers, touch Supabase, execute SQL, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md`
- `docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Shared Bucket Mount Failure

| Area | Value |
| --- | --- |
| Failed proof job | `qwen25vl-mount-read-proof-0627004851` |
| Failed execution | `qwen25vl-mount-read-proof-0627004851-j26sn` |
| Shared bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Failure reason | GCSFuse mount required bucket-level `storage.objects.list` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Exit code | `255` |
| Proof job deleted | true |

The earlier prefix-scoped IAM binding was intentionally narrow, but Cloud Run GCSFuse performs a bucket storage-layout/list check during mount setup. Rather than broaden access on the shared generated-assets bucket, this packet moved the model cache into a dedicated private model-cache bucket.

## Dedicated Model-cache Bucket

| Area | Value |
| --- | --- |
| Bucket | `reeditpro-staging-reeditpro-model-cache` |
| Location | `US-CENTRAL1` |
| Storage class | `STANDARD` |
| Uniform bucket-level access | true |
| Public access prevention | `enforced` |
| Soft delete retention | `604800s` |
| Runtime IAM role | `roles/storage.objectViewer` |
| Runtime IAM member | `serviceAccount:reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Public principal granted | false |
| Broad storage admin granted | false |

The dedicated bucket contains only the model-cache copy needed for this Qwen lane. Bucket-wide read is therefore narrower than granting bucket-wide list/read on the shared generated-assets bucket.

## Dedicated Cache Inventory

| Area | Value |
| --- | --- |
| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Object count | `16` |
| Total bytes | `16595981281` |
| Total GiB | `15.46GiB` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Full aggregate SHA-256 recomputed now | false |

## Passing Mount Read Proof

| Area | Value |
| --- | --- |
| Proof job | `qwen25vl-mount-read-proof-0627005216` |
| Proof execution | `qwen25vl-mount-read-proof-0627005216-d4m6q` |
| Execution created | `2026-06-27T00:52:19.958105Z` |
| Execution started | `2026-06-27T00:52:30.127366Z` |
| Execution completed | `2026-06-27T00:54:15.968491Z` |
| Completion status | success |
| Execution duration | `1m45.84s` |
| CPU | `2` |
| Memory | `4Gi` |
| GPU requested | false |
| Retry count | `0` |
| Proof job deleted | true |
| Remaining proof jobs | none observed |

The proof job used the same pushed Qwen worker image digest and service account as the deployed fail-closed service, but it ran a short CPU-only metadata script. It listed the mounted directory, statted all expected files, and read only small metadata files.

## Proof JSON Summary

| Area | Value |
| --- | --- |
| `ok` | true |
| Mounted file count | `16` |
| Mounted total bytes | `16595981281` |
| Missing required files | none |
| Unexpected files | none |
| Full aggregate hash computed | false |
| `config.json` read bytes | `1374` |
| `generation_config.json` read bytes | `216` |
| `model.safetensors.index.json` read bytes | `4096` |
| `preprocessor_config.json` read bytes | `350` |
| `tokenizer_config.json` read bytes | `4096` |

Small metadata read hashes:

| File | First-read SHA-256 |
| --- | --- |
| `config.json` | `77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43` |
| `generation_config.json` | `0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e` |
| `model.safetensors.index.json` | `f7363efc3114426dba3c041b9fd40d70899506a0dd4915e9762f2126867db0b1` |
| `preprocessor_config.json` | `f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0` |
| `tokenizer_config.json` | `7171f6df1e25a8efeeddb13da93dcaf3c1904a5e9895b7d1addae49a5be32a09` |

## Service Update

| Area | Value |
| --- | --- |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Previous ready revision | `reeditpro-qwen2-5-vl-l4-worker-00001-t88` |
| Updated ready revision | `reeditpro-qwen2-5-vl-l4-worker-00002-r2s` |
| Operation ID | `454569de-8a93-4caf-ae08-16b80912aca7` |
| Image digest | `sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630` |
| Traffic | `100%` to latest revision |
| Service ready | true |
| Service URL | present but redacted in repo evidence |
| Public unauthenticated access | disabled |
| Ingress | `internal-and-cloud-load-balancing` |
| IAM invoker bindings | none |

## Updated Runtime Shape

| Area | Value |
| --- | --- |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| GPU | `1` x `nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Timeout | `900s` |
| Deploy health check | disabled |
| CPU throttling | disabled |
| Startup CPU boost | enabled |
| GPU zonal redundancy | disabled for first cost-focused proof |

## Updated Private Mount

| Area | Value |
| --- | --- |
| Volume name | `qwen-model-cache` |
| Driver | `gcsfuse.run.googleapis.com` |
| Bucket | `reeditpro-staging-reeditpro-model-cache` |
| Read-only | true |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Mount options | `only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs` |
| Runtime data-plane read proof | passed via one-off Cloud Run Job |
| Service runtime request sent | false |
| Model import through service | not attempted |

## Fail-closed Environment Verified

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `HF_HUB_DISABLE_TELEMETRY=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `REAL_MEDIA_INPUT_ENABLED=false`
- `ARBITRARY_MEDIA_INPUT_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`
- `QWEN_APPROVED_SNAPSHOT_REQUIRED=true`
- `QWEN_QUEUE_LEASE_REQUIRED=true`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_MODEL_CACHE_BUCKET=reeditpro-staging-reeditpro-model-cache`
- `QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct`
- `QWEN_MODEL_REVISION=cc594898137f460bfe9f0759e9844b3ce807cfb5`
- `QWEN_MODEL_AGGREGATE_SHA256=46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`

## Runtime Gates

- `dedicatedModelCacheBucketCreated=true`
- `dedicatedModelCacheCopied=true`
- `dedicatedModelCacheObjectCount=16`
- `dedicatedModelCacheTotalBytes=16595981281`
- `dedicatedModelCachePublicAccessPreventionEnforced=true`
- `dedicatedModelCacheUniformBucketLevelAccess=true`
- `runtimeServiceAccountObjectViewerOnDedicatedBucket=true`
- `sharedGeneratedAssetsBucketBroadReadGranted=false`
- `failedSharedBucketProofRecorded=true`
- `passingDedicatedBucketProofRecorded=true`
- `proofJobCreated=true`
- `proofJobDeleted=true`
- `cloudRunServiceUpdated=true`
- `cloudRunRevisionReady=true`
- `cloudRunVolumeMountUpdated=true`
- `runtimeDataPlaneReadProofPassed=true`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `apiServerInvoked=false`
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

## What This Proves

- A dedicated private model-cache bucket is safer than granting bucket-wide list access on the shared generated-assets bucket.
- The deployed worker service account can mount and read the pinned Qwen model cache from the dedicated bucket.
- The mounted cache contains the expected 16 files and total byte count.
- The fail-closed Cloud Run service now points at the bucket shape that passed runtime data-plane proof.
- The GPU service remains scale-to-zero oriented with `minInstances=0`, `maxInstances=1`, and no public unauthenticated access.

## What This Does Not Prove

- It does not prove model import.
- It does not prove model load.
- It does not prove inference.
- It does not prove request routing.
- It does not prove Supabase job/lease integration.
- It does not prove approved snapshot enforcement at runtime.
- It does not prove billing/credit execution.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_27-CLOUD-RUN-GPU-MODEL-IMPORT-PROOF: verify Qwen model import from private mount on L4, no inference`
