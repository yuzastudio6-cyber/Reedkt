# WORKER_RUNTIME_JOBS SOUND CPU Phase 95 Private Manifest Static Types Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-types-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-types-owner-review-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution",
  "acceptedFutureTypeExports": [
    "SoundCpuPrivateManifestPersistenceContract",
    "SoundCpuPrivateManifestPersistenceInput",
    "SoundCpuPrivateManifestPersistenceResult",
    "SoundCpuPrivateManifestPersistenceBlockedReason",
    "SoundCpuPrivateManifestPersistenceAuditShape"
  ],
  "acceptedRequiredContractFields": [
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
  "acceptedOpaqueReferenceFields": [
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

The static type plan is accepted for later source creation only. The accepted types do not approve persistence, media access, artifact writes, signed URLs, or Supabase writes today.
