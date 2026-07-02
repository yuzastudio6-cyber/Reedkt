# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE148-ACTUAL-DISPATCH-CONTRACT-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation
{
  "label": "worker-runtime-jobs-sound-cpu-phase148-actual-dispatch-contract-source-creation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase147_dispatch_contract_source_creation_plan_completed_with_warnings_ready_for_actual_dispatch_contract_source_creation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase148_actual_dispatch_contract_source_creation_completed_with_warnings_ready_for_dispatch_contract_source_owner_review",
  "goal": "Create only the fail-closed static dispatch contract source module at the approved path.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "sourceCreationScope": {
    "createFailClosedStaticSourceOnly": true,
    "createRuntimeDispatcher": false,
    "enableWorkerDispatchExecution": false,
    "enableRouteExecution": false,
    "enableClaimLeaseMutation": false,
    "enableSupabaseMutation": false,
    "enableSqlExecution": false,
    "enableMediaProcessing": false,
    "enableArtifactCreation": false,
    "enableRealUserMediaBeta": false,
    "enablePaidProduction": false
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

Use this prompt only after Phase147 merges. It may create the static fail-closed source file, but it must not enable dispatch or runtime execution.
