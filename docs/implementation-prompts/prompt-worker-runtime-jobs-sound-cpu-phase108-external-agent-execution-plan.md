# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE108-EXTERNAL-AGENT-EXECUTION-PLAN

```json worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_owner_review_passed_with_warnings_ready_for_external_agent_execution_plan_no_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_owner_review_no_execution",
  "planningScope": {
    "planExternalAgentExecutionSurface": true,
    "defineAllowedAgentInputs": true,
    "defineBlockedRuntimeEffects": true,
    "defineStopConditions": true,
    "defineControlledProofRequirements": true,
    "allowExternalAgentExecutionToday": false,
    "allowWorkerDispatchToday": false,
    "allowFactoryCallToday": false,
    "allowManifestPersistenceToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false,
    "openMediaFileToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
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

Plan the external-agent execution surface next. Do not execute an external agent in the planning gate.
