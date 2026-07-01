# WORKER_RUNTIME_JOBS SOUND CPU Phase 77 Prohibited Reference Static Scan Register

```json worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-prohibited-reference-static-scan-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "scanPassed": {
    "rawFilesystemPathReferences": true,
    "httpUrlReferences": true,
    "signedUrlReferences": true,
    "publicArtifactReferences": true,
    "providerOutputBlobReferences": true,
    "serviceRolePayloadReferences": true,
    "modelWeightLocationReferences": true,
    "artifactWriteTargetReferences": true
  },
  "allowedReferenceTypes": [
    "manifestBackedFixtureId",
    "privateMediaAssetId",
    "plannedPrivateArtifactId"
  ],
  "executionState": {
    "storageObjectReadToday": false,
    "signedUrlCreatedToday": false,
    "publicArtifactCreatedToday": false,
    "providerModelCalledToday": false
  }
}
```

The fixture plan contains only allowed opaque planning IDs and no executable references.
