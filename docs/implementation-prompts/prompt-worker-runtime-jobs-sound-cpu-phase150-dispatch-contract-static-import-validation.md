# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE150-DISPATCH-CONTRACT-STATIC-IMPORT-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase150-dispatch-contract-static-import-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase149_dispatch_contract_source_owner_review_passed_with_warnings_ready_for_static_import_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase150_dispatch_contract_static_import_validation_passed_with_warnings_ready_for_index_export_plan",
  "goal": "Run a controlled static import validation for the fail-closed dispatch contract source without enabling index export or execution.",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "validationScope": {
    "allowStaticImport": true,
    "allowSafeFixtureValidation": true,
    "allowDisabledEnvelopeConstruction": true,
    "allowIndexExport": false,
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

Use this prompt after Phase149 merges. Static import validation may exercise pure contract helpers only; it must not dispatch work.
