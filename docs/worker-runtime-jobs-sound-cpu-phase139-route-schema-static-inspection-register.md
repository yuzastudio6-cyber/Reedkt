# WORKER_RUNTIME_JOBS SOUND CPU Phase 139 Route Schema Static Inspection Register

```json worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase139-route-schema-static-inspection-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase139_static_route_source_validation_passed_with_warnings_ready_for_route_source_owner_review",
  "inspectedFile": "server/validation/sound-cpu-worker-route-schemas.ts",
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
  "requiredFieldsDetected": [
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
  "disabledRuntimeFlagValidation": "z.literal(false)"
}
```

The schema accepts only the approved planning surface and requires disabled runtime flags.
