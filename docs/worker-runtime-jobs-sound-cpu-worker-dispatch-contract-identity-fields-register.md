# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Identity Fields Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-identity-fields-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "identityFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "jobType",
    "workerName",
    "imageName",
    "idempotencyKey",
    "attemptNumber",
    "maxAttempts"
  ],
  "acceptedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImageNames": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "schemaApprovedToday": false,
  "workerDispatchApprovedToday": false
}
```
