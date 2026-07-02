# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE152-DISPATCH-CONTRACT-INDEX-EXPORT-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review
{
  "label": "worker-runtime-jobs-sound-cpu-phase152-dispatch-contract-index-export-owner-review",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase151_dispatch_contract_index_export_plan_completed_with_warnings_ready_for_index_export_owner_review",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase152_dispatch_contract_index_export_owner_review_passed_with_warnings_ready_for_actual_index_export_source_creation",
  "goal": "Review the planned index export before any source change.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "reviewScope": {
    "reviewIndexExportPlanOnly": true,
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

Use this prompt after Phase151 merges. It reviews the plan only; it must not edit `index.ts`.
