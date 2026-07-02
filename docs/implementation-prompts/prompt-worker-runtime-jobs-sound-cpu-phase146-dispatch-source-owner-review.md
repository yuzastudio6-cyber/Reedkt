# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE146-DISPATCH-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review
{
  "label": "worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-review",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase145_dispatch_contract_source_plan_completed_with_warnings_ready_for_dispatch_source_owner_review",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase146_dispatch_source_owner_review_passed_with_warnings_ready_for_dispatch_contract_source_creation_plan",
  "goal": "Review the planned SOUND CPU dispatch contract source path and schema before any source creation.",
  "reviewScope": {
    "reviewSourcePlanOnly": true,
    "allowSourceCreation": false,
    "allowWorkerDispatchExecution": false,
    "allowRouteExecutionEnablement": false,
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

Use this prompt after Phase145 merges. Do not create dispatch source in the owner-review prompt.
