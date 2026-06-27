# Qwen2.5-VL 7B Cloud Run GPU Private Mount Read Proof Result Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_mount_read_proof_passed_dedicated_bucket_no_model_import_no_inference",
  "sharedBucketMountFailure": {
    "jobName": "qwen25vl-mount-read-proof-0627004851",
    "executionName": "qwen25vl-mount-read-proof-0627004851-j26sn",
    "bucket": "reeditpro-staging-reeditpro-generated-assets",
    "exitCode": 255,
    "failureReason": "gcsfuse_required_bucket_level_storage_objects_list",
    "proofJobDeleted": true,
    "sharedGeneratedAssetsBucketBroadReadGranted": false
  },
  "dedicatedModelCacheBucket": {
    "project": "reeditpro",
    "bucket": "reeditpro-staging-reeditpro-model-cache",
    "location": "US-CENTRAL1",
    "storageClass": "STANDARD",
    "uniformBucketLevelAccess": true,
    "publicAccessPrevention": "enforced",
    "softDeleteRetentionSeconds": 604800,
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "runtimeIamRole": "roles/storage.objectViewer",
    "publicPrincipalGranted": false,
    "broadStorageAdminGranted": false
  },
  "dedicatedCacheInventory": {
    "model": "Qwen/Qwen2.5-VL-7B-Instruct",
    "revision": "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    "objectPrefix": "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    "objectCount": 16,
    "totalBytes": 16595981281,
    "totalGib": "15.46GiB",
    "expectedAggregateSha256": "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b",
    "fullAggregateSha256ComputedNow": false
  },
  "proofExecution": {
    "jobName": "qwen25vl-mount-read-proof-0627005216",
    "executionName": "qwen25vl-mount-read-proof-0627005216-d4m6q",
    "createdAt": "2026-06-27T00:52:19.958105Z",
    "startedAt": "2026-06-27T00:52:30.127366Z",
    "completedAt": "2026-06-27T00:54:15.968491Z",
    "completedSuccessfully": true,
    "duration": "1m45.84s",
    "cpu": 2,
    "memory": "4Gi",
    "gpuRequested": false,
    "maxRetries": 0,
    "proofJobDeleted": true,
    "remainingProofJobsObserved": false
  },
  "proofJson": {
    "ok": true,
    "bucket": "reeditpro-staging-reeditpro-model-cache",
    "fileCount": 16,
    "totalBytesFromStat": 16595981281,
    "expectedObjectCount": 16,
    "expectedTotalBytes": 16595981281,
    "missingRequiredFiles": [],
    "unexpectedFiles": [],
    "fullAggregateSha256Computed": false,
    "smallReads": {
      "config.json": {
        "readBytes": 1374,
        "sha256First4KiB": "77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43"
      },
      "generation_config.json": {
        "readBytes": 216,
        "sha256First4KiB": "0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e"
      },
      "model.safetensors.index.json": {
        "readBytes": 4096,
        "sha256First4KiB": "f7363efc3114426dba3c041b9fd40d70899506a0dd4915e9762f2126867db0b1"
      },
      "preprocessor_config.json": {
        "readBytes": 350,
        "sha256First4KiB": "f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0"
      },
      "tokenizer_config.json": {
        "readBytes": 4096,
        "sha256First4KiB": "7171f6df1e25a8efeeddb13da93dcaf3c1904a5e9895b7d1addae49a5be32a09"
      }
    }
  },
  "serviceUpdate": {
    "project": "reeditpro",
    "region": "us-central1",
    "serviceName": "reeditpro-qwen2-5-vl-l4-worker",
    "previousRevision": "reeditpro-qwen2-5-vl-l4-worker-00001-t88",
    "updatedRevision": "reeditpro-qwen2-5-vl-l4-worker-00002-r2s",
    "operationId": "454569de-8a93-4caf-ae08-16b80912aca7",
    "ready": true,
    "trafficPercent": 100,
    "imageDigest": "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    "serviceUrlPresent": true,
    "serviceUrlRedactedInRepoEvidence": true,
    "publicUnauthenticatedAccessAllowed": false,
    "ingress": "internal-and-cloud-load-balancing",
    "iamBindingsPresent": false
  },
  "runtimeShape": {
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "gpuType": "nvidia-l4",
    "gpuCount": 1,
    "cpu": 8,
    "memory": "32Gi",
    "minInstances": 0,
    "maxInstances": 1,
    "concurrency": 1,
    "timeoutSeconds": 900,
    "deployHealthCheckDisabled": true,
    "cpuThrottlingDisabled": true,
    "startupCpuBoostEnabled": true,
    "gpuZonalRedundancyDisabled": true
  },
  "mount": {
    "volumeName": "qwen-model-cache",
    "driver": "gcsfuse.run.googleapis.com",
    "bucket": "reeditpro-staging-reeditpro-model-cache",
    "readOnly": true,
    "mountPath": "/models/qwen2.5-vl-7b-instruct",
    "mountOptions": "only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs",
    "runtimeDataPlaneReadProofPassed": true,
    "serviceRuntimeRequestSent": false,
    "modelImportThroughServiceAttempted": false
  },
  "runtimeFlags": {
    "dedicatedModelCacheBucketCreated": true,
    "dedicatedModelCacheCopied": true,
    "dedicatedModelCacheObjectCount": 16,
    "dedicatedModelCacheTotalBytes": 16595981281,
    "dedicatedModelCachePublicAccessPreventionEnforced": true,
    "dedicatedModelCacheUniformBucketLevelAccess": true,
    "runtimeServiceAccountObjectViewerOnDedicatedBucket": true,
    "sharedGeneratedAssetsBucketBroadReadGranted": false,
    "failedSharedBucketProofRecorded": true,
    "passingDedicatedBucketProofRecorded": true,
    "proofJobCreated": true,
    "proofJobDeleted": true,
    "cloudRunServiceUpdated": true,
    "cloudRunRevisionReady": true,
    "cloudRunVolumeMountUpdated": true,
    "runtimeDataPlaneReadProofPassed": true,
    "serviceRuntimeRequestSent": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "modelInferenceRun": false,
    "apiServerInvoked": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_27-CLOUD-RUN-GPU-MODEL-IMPORT-PROOF: verify Qwen model import from private mount on L4, no inference"
}
```
