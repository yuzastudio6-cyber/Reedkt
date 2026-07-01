# WORKER_RUNTIME_JOBS SOUND CPU Phase 91 Controlled Manifest Instance Field Map

```json worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map
{
  "label": "worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-field-map",
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredFields": [
    "schemaVersion",
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "jobType",
    "privateMediaAssetIds",
    "plannedPrivateArtifactIds",
    "runtimeDefaults"
  ],
  "acceptedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "referencePolicy": {
    "privateMediaAssetIdsAreOpaque": true,
    "plannedPrivateArtifactIdsAreOpaque": true,
    "rawMediaPathsRejected": true,
    "signedUrlsRejectedAsSourceOfTruth": true,
    "publicArtifactUrlsRejected": true,
    "providerOutputBlobsRejected": true,
    "serviceRolePayloadsRejected": true,
    "secretValuesRejected": true
  },
  "executionState": {
    "createManifestToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false,
    "dispatchWorkerToday": false
  }
}
```

The planned field map remains private-reference-only and approved-snapshot-bound.
