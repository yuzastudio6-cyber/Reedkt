# WORKER_RUNTIME_JOBS SOUND CPU Phase 110 Limited External-Agent Execution Scope Register

```json worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_plan_completed_with_warnings_ready_for_limited_external_agent_execution_owner_review_no_real_user_media",
  "limitedExecutionEnvelope": {
    "purpose": "future_limited_external_agent_execution_no_real_user_media",
    "inputMode": "synthetic_or_no_media_only",
    "allowedWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "allowedImages": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "allowedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "allowedToolCount": 15,
    "requiredEnvelopeFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "syntheticPayload",
      "runtimeFlags",
      "stopConditions"
    ]
  },
  "runtimeFlagsMustRemainFalse": [
    "allowRealUserMedia",
    "allowWorkerDispatch",
    "allowRouteExecution",
    "allowManifestPersistence",
    "allowMediaOpen",
    "allowProviderCall",
    "allowModelCall",
    "allowSupabaseMutation",
    "allowSqlExecution",
    "allowStorageObjectCreation",
    "allowSignedUrlCreation",
    "allowArtifactCreation",
    "allowBetaUnlock",
    "allowProductionUnlock"
  ]
}
```

The future limited execution envelope remains synthetic or no-media only.
