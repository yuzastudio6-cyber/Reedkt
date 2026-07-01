# WORKER_RUNTIME_JOBS SOUND CPU Phase 94 Private Manifest Field Contract

```json worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract
{
  "label": "worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract",
  "contractVersion": "sound-cpu-private-manifest-persistence-contract-v0-plan",
  "requiredFutureFields": [
    "schemaVersion",
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "stepId",
    "idempotencyKey",
    "workerName",
    "jobType",
    "privateManifestId",
    "manifestSchemaVersion",
    "runtimeDefaults",
    "createdByWorker",
    "createdAt"
  ],
  "optionalFutureOpaqueReferenceFields": [
    "privateMediaAssetIds",
    "plannedPrivateArtifactIds",
    "privateStorageObjectRefs",
    "auditEventId"
  ],
  "allowedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "rejectedFields": [
    "rawPromptText",
    "rawMediaPaths",
    "signedUrls",
    "providerOutputBlobs",
    "serviceRolePayloads",
    "secretValues",
    "modelWeightLocations",
    "publicArtifactUrls"
  ],
  "runtimeDefaults": {
    "workerExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactWritesEnabled": false,
    "signedUrlCreationEnabled": false,
    "supabaseWritesEnabled": false
  }
}
```

The field contract is a planning artifact. It keeps future persistence limited to approved identifiers, opaque private references, and false runtime defaults.
