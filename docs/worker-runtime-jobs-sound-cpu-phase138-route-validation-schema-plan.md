# WORKER_RUNTIME_JOBS SOUND CPU Phase 138 Route Validation Schema Plan

```json worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase138-route-validation-schema-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase138_route_source_creation_plan_completed_with_warnings_ready_for_route_source_owner_review",
  "futureValidationRules": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "privateMediaManifestIdRequired": true,
    "workerNameMustMatchAcceptedSet": true,
    "imageNameMustMatchAcceptedSet": true,
    "jobTypeMustMatchAcceptedSet": true,
    "runtimeFlagsMustDefaultFalse": true
  },
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
  "validationSourceCreated": false
}
```

The validation contract remains a planned source target and does not introduce runtime schema exports in this gate.
