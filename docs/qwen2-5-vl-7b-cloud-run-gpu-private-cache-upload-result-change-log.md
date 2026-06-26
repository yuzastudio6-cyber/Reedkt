# Qwen2.5-VL 7B Cloud Run GPU Private Cache Upload Result Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_blocked_partial_no_deploy_no_inference",
  "mode": "cloud_run_gpu_private_cache_upload_result",
  "workstream": "AI_VIDEO_BROLL_GENERATION",
  "toolId": "qwen2_5_vl_7b_instruct",
  "uploadTarget": {
    "projectInspected": "reeditpro",
    "bucket": "reeditpro-staging-reeditpro-generated-assets",
    "bucketLocation": "US-CENTRAL1",
    "objectPrefix": "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/",
    "revision": "cc594898137f460bfe9f0759e9844b3ce807cfb5"
  },
  "expectedManifest": {
    "fileCount": 16,
    "weightShardCount": 5,
    "totalBytes": 16595981281,
    "checksumAlgorithm": "sha256",
    "aggregateSha256": "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
  },
  "remoteInventory": {
    "objectCount": 6,
    "totalBytes": 1694572,
    "expectedObjectCount": 16,
    "expectedTotalBytes": 16595981281,
    "remoteUploadComplete": false,
    "remoteChecksumVerified": false,
    "remoteAggregateSha256Recomputed": false
  },
  "uploadedObjects": [
    {
      "name": ".gitattributes",
      "bytes": 1519
    },
    {
      "name": "README.md",
      "bytes": 18574
    },
    {
      "name": "chat_template.json",
      "bytes": 1050
    },
    {
      "name": "config.json",
      "bytes": 1374
    },
    {
      "name": "generation_config.json",
      "bytes": 216
    },
    {
      "name": "merges.txt",
      "bytes": 1671839
    }
  ],
  "blockedOutcome": {
    "uploadAttempted": true,
    "uploadPassed": false,
    "uploadStatus": "blocked_partial",
    "blocker": "large_shard_transfer_throughput_and_resumable_composite_completion",
    "observedLargeShardAverageThroughput": "about_4_7_mib_per_second",
    "finalShardObjectsCreated": false,
    "temporaryCompositeObjectsCountObserved": 17,
    "temporaryCompositeObjectsTreatedAsFinalModelCache": false
  },
  "runtimeFlags": {
    "privateCacheUploadResultCreated": true,
    "gcsObjectUploadAttempted": true,
    "gcsObjectUploadPassed": false,
    "remoteChecksumVerified": false,
    "remoteAggregateSha256Recomputed": false,
    "cloudRunVolumeMountCreated": false,
    "cloudRunDeployCommandExecuted": false,
    "cloudRunServiceCreated": false,
    "cloudRunJobCreated": false,
    "artifactRegistryImageCreated": false,
    "reservationCreated": false,
    "vmCreated": false,
    "dependencyInstallRun": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "modelInferenceRun": false,
    "apiServerStarted": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_19-FIX-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD: retry private cache upload with improved resumable transfer strategy, no deploy/no inference"
}
```
