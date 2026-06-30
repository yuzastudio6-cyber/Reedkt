# WORKER_RUNTIME_JOBS SOUND CPU Phase 71 Private Manifest Validation Call Boundary Register

```json worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-call-boundary-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-validation-call-boundary-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_plan_completed_with_warnings_ready_for_private_manifest_instance_creation_owner_review_no_media_no_artifacts",
  "validationFunction": "validateSoundCpuPrivateMediaManifest",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "plannedBoundary": {
    "callValidationBeforeExecution": true,
    "validationIsPure": true,
    "validationRunsOnInMemoryInputOnly": true,
    "validationMayReturnIssues": true,
    "validationMayNotOpenMedia": true,
    "validationMayNotWriteArtifacts": true,
    "validationMayNotDispatchWorkers": true,
    "validationMayNotTouchSupabase": true,
    "validationMayNotCreateSignedUrls": true
  },
  "plannedFailureHandling": {
    "missingRequiredFieldBlocksCreation": true,
    "invalidWorkerNameBlocksCreation": true,
    "invalidJobTypeBlocksCreation": true,
    "invalidPrivateMediaAssetIdBlocksCreation": true,
    "invalidPlannedPrivateArtifactIdBlocksCreation": true,
    "runtimeFlagTrueBlocksCreation": true
  },
  "todayAllowed": {
    "boundaryPlanning": true,
    "validationExecutionWithFixture": false,
    "manifestInstanceCreation": false,
    "mediaProcessing": false,
    "artifactCreation": false
  }
}
```

The validation call boundary is planned but not executed with a manifest fixture in this gate.
