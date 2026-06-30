# WORKER_RUNTIME_JOBS SOUND CPU Phase 71 Private Manifest Instance Creation Owner Shape Review Register

```json worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-shape-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-instance-creation-owner-shape-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_controlled_private_manifest_instance_creation_no_media_no_artifacts",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "acceptedCreationInputs": [
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
  "acceptedCreationSteps": [
    "assemble transient manifest input in memory",
    "call validateSoundCpuPrivateMediaManifest before downstream use",
    "reject runtime flags that are not false",
    "return validation issues without opening media",
    "return validation issues without writing artifacts"
  ],
  "acceptedOutputCategories": {
    "validManifestInputInMemory": true,
    "validationResult": true,
    "sanitizedValidationIssues": true,
    "persistedManifestInstance": false,
    "artifactRecord": false,
    "storageObject": false
  },
  "todayAllowed": {
    "ownerReview": true,
    "controlledInstanceCreationNext": true,
    "realMediaProcessing": false,
    "artifactCreation": false,
    "workerDispatch": false,
    "supabaseSql": false
  }
}
```

The shape is accepted for a controlled no-media/no-artifact instance creation gate.
