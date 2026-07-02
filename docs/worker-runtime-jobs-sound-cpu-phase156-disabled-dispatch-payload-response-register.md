# WORKER_RUNTIME_JOBS SOUND CPU Phase156 Disabled Dispatch Payload Response Register

```json worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-payload-response-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase156-disabled-dispatch-payload-response-register",
  "requiredPayloadFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "attemptMetadata",
    "runtimeFlags"
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
  "requiredDisabledResponse": {
    "acceptedForDispatch": false,
    "blockedReason": "worker_dispatch_execution_not_enabled",
    "ownerGateRequired": "WORKER_RUNTIME_JOBS",
    "noWorkerExecution": true,
    "noRouteExecution": true,
    "noSupabaseMutation": true,
    "noSqlExecution": true,
    "noMediaProcessing": true,
    "noArtifactCreated": true
  }
}
```
