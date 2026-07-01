# WORKER_RUNTIME_JOBS SOUND CPU Phase 72 Controlled Private Manifest Instance Register

```json worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_created_with_warnings_ready_for_instance_creation_owner_review_no_media_no_artifacts",
  "controlledInstance": {
    "schemaVersion": "sound-cpu-private-media-manifest-v1",
    "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "approvedPlanSnapshotId": "approved-plan-snapshot-sound-cpu-phase72-controlled",
    "workspaceId": "workspace-sound-cpu-phase72-controlled",
    "projectId": "project-sound-cpu-phase72-controlled",
    "jobId": "job-sound-cpu-phase72-controlled",
    "idempotencyKey": "idempotency-sound-cpu-phase72-controlled",
    "workerName": "sound-cpu-analysis-worker",
    "jobType": "sound.package_import_smoke",
    "privateMediaAssetIdCount": 1,
    "plannedPrivateArtifactIdCount": 1,
    "usesOpaqueFixtureIdsOnly": true,
    "inMemoryOnly": true,
    "persistedManifestInstance": false,
    "storageObjectCreated": false,
    "artifactRecordCreated": false
  },
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
  }
}
```

The controlled instance uses opaque synthetic identifiers only. It is proof evidence for the manifest shape and validation boundary, not a persisted runtime manifest.
