# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE110-LIMITED-EXTERNAL-AGENT-EXECUTION-PLAN

```json worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_plan_no_real_user_media",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_plan_completed_with_warnings_ready_for_limited_external_agent_execution_owner_review_no_real_user_media",
  "planningScope": {
    "planLimitedExternalAgentExecution": true,
    "useSyntheticOrNoMediaInputsOnly": true,
    "allowedToolCount": 15,
    "allowedWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "allowedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "allowExecutionToday": false,
    "allowRealUserMedia": false,
    "allowWorkerDispatchToday": false,
    "allowRouteExecutionToday": false,
    "allowManifestPersistenceToday": false,
    "allowMediaOpenToday": false,
    "allowProviderCallToday": false,
    "allowModelCallToday": false,
    "allowSupabaseMutationToday": false,
    "allowSqlExecutionToday": false,
    "allowStorageObjectCreationToday": false,
    "allowSignedUrlCreationToday": false,
    "allowArtifactCreationToday": false,
    "allowBetaUnlockToday": false,
    "allowProductionUnlockToday": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Plan the limited execution gate before any execution is attempted.
