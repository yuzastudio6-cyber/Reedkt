# WORKER_RUNTIME_JOBS SOUND CPU Phase 88 Private Manifest Instance Shape Plan

```json worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-private-manifest-instance-shape-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "plannedManifestInstanceShape": {
    "schemaVersion": "sound-cpu-private-media-manifest-v1",
    "sourceContractPath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "requiredFields": [
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
    "runtimeDefaults": {
      "soundCpuRuntimeEnabled": false,
      "workerExecutionEnabled": false,
      "mediaProcessingEnabled": false,
      "artifactWriteEnabled": false,
      "storageTransferEnabled": false,
      "signedUrlCreationEnabled": false,
      "publicArtifactCreationEnabled": false,
      "databaseMutationEnabled": false,
      "sqlExecutionEnabled": false,
      "providerCallEnabled": false,
      "modelCallEnabled": false
    },
    "disallowedFields": [
      "rawPrompt",
      "rawMediaPath",
      "signedUrl",
      "publicArtifactUrl",
      "providerOutputBlob",
      "serviceRolePayload",
      "artifactWriteTarget",
      "modelWeightLocation",
      "secretValue"
    ]
  },
  "executionState": {
    "manifestInstanceCreatedToday": false,
    "manifestPersistedToday": false,
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false
  }
}
```

The instance shape is a future private record contract and is not created in this gate.
