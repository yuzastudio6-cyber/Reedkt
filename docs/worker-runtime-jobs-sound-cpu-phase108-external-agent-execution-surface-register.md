# WORKER_RUNTIME_JOBS SOUND CPU Phase 108 External-Agent Execution Surface Register

```json worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_owner_review_no_execution",
  "plannedSurface": {
    "agentEntrypointKind": "future_controlled_external_agent_call_boundary",
    "proofMode": "future_synthetic_no_media_no_persistence",
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
    "allowedToolCount": 15
  },
  "requiredInputEnvelope": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "syntheticPayload",
    "runtimeFlags"
  ],
  "runtimeFlagsMustBeFalse": [
    "allowMediaOpen",
    "allowManifestPersistence",
    "allowSupabaseMutation",
    "allowStorageObjectCreation",
    "allowSignedUrlCreation",
    "allowProviderCall",
    "allowModelCall",
    "allowWorkerDispatch",
    "allowRouteExecution",
    "allowBetaUnlock",
    "allowProductionUnlock"
  ]
}
```

The first external-agent proof must be synthetic and no-side-effect.
