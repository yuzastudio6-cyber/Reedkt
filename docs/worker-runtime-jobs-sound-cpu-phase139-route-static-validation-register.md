# WORKER_RUNTIME_JOBS SOUND CPU Phase 139 Route Static Validation Register

```json worker-runtime-jobs-sound-cpu-phase139-route-static-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase139-route-static-validation-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase139_actual_route_source_created_with_warnings_ready_for_static_route_source_validation",
  "acceptedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "requiredRequestFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "privateMediaManifestId",
    "staticOnlyRuntimeFlags"
  ],
  "nextValidation": {
    "staticRouteSourceValidationMayProceed": true,
    "controlledNoMediaRouteImportValidationMayProceedAfterStaticValidation": true,
    "routeExecutionProofMayProceed": false
  }
}
```

The validation source enforces the accepted planning set and requires disabled runtime flags.
