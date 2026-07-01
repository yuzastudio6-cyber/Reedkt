# WORKER_RUNTIME_JOBS SOUND CPU Phase 88 Private Reference Instance Plan

```json worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-reference-instance-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "privateReferenceInstancePolicy": {
    "privateMediaAssetIdsAreOpaqueIds": true,
    "plannedPrivateArtifactIdsAreOpaqueIds": true,
    "minimumPrivateMediaAssetCount": 1,
    "minimumPlannedPrivateArtifactCount": 1,
    "signedUrlsRejected": true,
    "publicUrlsRejected": true,
    "localFilePathsRejected": true,
    "mediaOpenRequiresFutureOwnerGate": true,
    "artifactWriteRequiresFutureOwnerGate": true
  },
  "executionState": {
    "resolvePrivateMediaReferenceToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false,
    "createSignedUrlToday": false,
    "storageTransferToday": false
  }
}
```

Private media and artifact references remain opaque IDs. They are not resolved, opened, written, or signed in this gate.
