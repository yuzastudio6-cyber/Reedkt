# WORKER_RUNTIME_JOBS SOUND CPU Phase 80 Private Manifest Instance Shape Plan

```json worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-private-manifest-instance-shape-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "plannedManifestInstanceShape": {
    "schemaVersion": "phase80.private-manifest-instance-plan.v1",
    "requiredFields": [
      "fixtureInstanceId",
      "sourceFixtureId",
      "privateMediaAssetId",
      "plannedPrivateArtifactId",
      "approvedPlanSnapshotId",
      "idempotencyKey",
      "runtimeFlags",
      "createdByGate"
    ],
    "runtimeFlags": {
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0"
    },
    "disallowedFields": [
      "rawMediaPath",
      "signedUrl",
      "publicArtifactUrl",
      "providerOutputBlob",
      "serviceRolePayload",
      "artifactWriteTarget",
      "modelWeightLocation"
    ]
  },
  "executionState": {
    "fixtureManifestPersistedToday": false,
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false
  }
}
```

The manifest shape is a future private record contract only.
