# WORKER_RUNTIME_JOBS SOUND CPU Phase 95 Private Manifest Static Contract Types Plan

```json worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan",
  "futureTypeExports": [
    "SoundCpuPrivateManifestPersistenceContract",
    "SoundCpuPrivateManifestPersistenceInput",
    "SoundCpuPrivateManifestPersistenceResult",
    "SoundCpuPrivateManifestPersistenceBlockedReason",
    "SoundCpuPrivateManifestPersistenceAuditShape"
  ],
  "requiredContractFields": [
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
  "opaqueReferenceFields": [
    "privateMediaAssetIds",
    "plannedPrivateArtifactIds",
    "privateStorageObjectRefs",
    "auditEventId"
  ],
  "rejectedInputFields": [
    "rawPromptText",
    "rawMediaPaths",
    "signedUrls",
    "providerOutputBlobs",
    "serviceRolePayloads",
    "secretValues",
    "modelWeightLocations",
    "publicArtifactUrls"
  ],
  "runtimeDefaultsMustRemainFalse": {
    "workerExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactWritesEnabled": false,
    "signedUrlCreationEnabled": false,
    "supabaseWritesEnabled": false
  }
}
```

The future static types must preserve the Phase 94 contract and keep all runtime defaults false.
