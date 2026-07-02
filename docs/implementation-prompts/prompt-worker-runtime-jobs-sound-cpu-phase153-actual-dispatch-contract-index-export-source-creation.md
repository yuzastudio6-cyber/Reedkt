# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE153-ACTUAL-DISPATCH-CONTRACT-INDEX-EXPORT-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation
{
  "label": "worker-runtime-jobs-sound-cpu-phase153-actual-dispatch-contract-index-export-source-creation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase152_dispatch_contract_index_export_owner_review_passed_with_warnings_ready_for_actual_index_export_source_creation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase153_actual_dispatch_contract_index_export_source_creation_completed_with_warnings_ready_for_index_export_static_validation",
  "goal": "Add index exports for the fail-closed dispatch contract only.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "sourceCreationScope": {
    "allowIndexExportSourceChange": true,
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

Use this prompt after Phase152 merges. It may edit `index.ts` only to export the static dispatch contract.
