# WORKER_RUNTIME_JOBS SOUND CPU Phase 89 Private Manifest Opaque Reference Static Validation Plan

```json worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-opaque-reference-static-validation-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-opaque-reference-static-validation-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "opaqueReferenceValidation": {
    "privateMediaAssetIdsMustBeNonEmptyStrings": true,
    "plannedPrivateArtifactIdsMustBeNonEmptyStrings": true,
    "rawMediaPathsRejected": true,
    "signedUrlsRejected": true,
    "publicArtifactUrlsRejected": true,
    "providerOutputBlobsRejected": true,
    "artifactWriteTargetsRejected": true,
    "validationIssuesPlanned": [
      "invalid_private_media_asset_id",
      "invalid_planned_private_artifact_id"
    ]
  },
  "executionState": {
    "useRealMediaBytesToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false,
    "createSignedUrlToday": false,
    "storageTransferCreatedToday": false
  }
}
```

The next static validation gate may validate opaque reference shape only. It must not dereference media or artifact locations.
