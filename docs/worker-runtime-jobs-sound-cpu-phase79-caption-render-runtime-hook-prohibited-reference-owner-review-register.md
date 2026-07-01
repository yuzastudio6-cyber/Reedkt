# WORKER_RUNTIME_JOBS SOUND CPU Phase 79 Prohibited Reference Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-prohibited-reference-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "acceptedScanPassed": {
    "filesystemPaths": true,
    "httpUrls": true,
    "signedUrls": true,
    "publicArtifactUrls": true,
    "providerOutputBlobs": true,
    "serviceRolePayloads": true,
    "secrets": true,
    "supabaseDbUrls": true
  },
  "acceptedBlockedReferenceClasses": [
    "raw_media_file_path",
    "signed_url",
    "public_artifact_url",
    "provider_output_blob",
    "service_role_payload",
    "model_weight_location",
    "artifact_write_target"
  ],
  "executionState": {
    "storageObjectReadToday": false,
    "signedUrlCreatedToday": false,
    "publicArtifactCreatedToday": false,
    "providerModelCalledToday": false
  }
}
```

The owner review accepts prohibited-reference coverage and keeps runtime references blocked.
