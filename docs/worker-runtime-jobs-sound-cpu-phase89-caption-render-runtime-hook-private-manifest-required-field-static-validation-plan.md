# WORKER_RUNTIME_JOBS SOUND CPU Phase 89 Private Manifest Required Field Static Validation Plan

```json worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-required-field-static-validation-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-required-field-static-validation-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredFieldsToValidate": [
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
  "validationIssuesPlanned": [
    "missing_required_field",
    "invalid_worker_name",
    "invalid_job_type"
  ],
  "executionState": {
    "staticValidationExecutedToday": false,
    "manifestInstanceCreatedToday": false,
    "workerDispatchedToday": false
  }
}
```

Required field validation is planned for the next gate without creating a manifest instance.
