# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE155-DISPATCH-CONTRACT-INDEX-EXPORT-OWNER-VALIDATION-REVIEW

```json worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review
{
  "label": "worker-runtime-jobs-sound-cpu-phase155-dispatch-contract-index-export-owner-validation-review",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase155_dispatch_contract_index_export_owner_validation_review_passed_with_warnings_ready_for_disabled_dispatch_route_plan",
  "goal": "Review Phase154 static index-export validation as WORKER_RUNTIME_JOBS before any disabled dispatch route planning.",
  "reviewScope": {
    "allowStaticValidationReview": true,
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

Use this prompt after Phase154 merges. It must review static validation only and keep dispatch execution disabled.
