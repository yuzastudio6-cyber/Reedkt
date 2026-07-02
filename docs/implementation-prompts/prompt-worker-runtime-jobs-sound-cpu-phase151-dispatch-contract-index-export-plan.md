# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE151-DISPATCH-CONTRACT-INDEX-EXPORT-PLAN

```json worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase151-dispatch-contract-index-export-plan",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase150_dispatch_contract_static_import_validation_passed_with_warnings_ready_for_index_export_plan",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase151_dispatch_contract_index_export_plan_completed_with_warnings_ready_for_index_export_owner_review",
  "goal": "Plan an index export for the validated fail-closed dispatch contract without adding the export.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "planningScope": {
    "allowIndexExportPlan": true,
    "allowIndexExportSourceChange": false,
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

Use this prompt after Phase150 merges. It plans index export only.
