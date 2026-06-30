# WORKER_RUNTIME_JOBS SOUND CPU Phase 70 Private Manifest Instance Owner Shape Review Register

```json worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-shape-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-shape-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_private_manifest_instance_creation_plan_no_media_no_artifacts",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "acceptedSchemaVersion": "sound-cpu-private-media-manifest-v1",
  "acceptedRequiredFields": [
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
  "runtimeDefaultsMustRemainFalse": {
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
  "todayAllowed": {
    "ownerReview": true,
    "creationPlanningNext": true,
    "manifestInstanceCreation": false,
    "workerDispatch": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseSql": false
  }
}
```

The owner review accepts the planned shape and requires all runtime defaults to remain false.
