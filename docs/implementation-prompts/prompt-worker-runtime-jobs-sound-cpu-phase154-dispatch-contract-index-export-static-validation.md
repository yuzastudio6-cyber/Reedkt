# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE154-DISPATCH-CONTRACT-INDEX-EXPORT-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase154-dispatch-contract-index-export-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase153_actual_dispatch_contract_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review",
  "goal": "Statically validate that the sound CPU package index exports only the fail-closed dispatch contract.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "validationScope": {
    "allowStaticIndexImportValidation": true,
    "allowWorkerDispatchExecution": false,
    "allowRouteExecution": false,
    "allowClaimLeaseMutation": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowMediaProcessing": false,
    "allowArtifactCreation": false,
    "allowRealUserMediaBeta": false,
    "allowPaidProduction": false
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

Use this prompt after Phase153 merges. It may run static import validation only and must not dispatch workers or execute routes.
