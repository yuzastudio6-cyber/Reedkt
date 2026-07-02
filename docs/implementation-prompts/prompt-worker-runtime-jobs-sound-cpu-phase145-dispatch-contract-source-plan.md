# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE145-DISPATCH-CONTRACT-SOURCE-PLAN

```json worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase144_worker_dispatch_contract_gap_review_completed_with_warnings_ready_for_dispatch_source_plan",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase145_dispatch_contract_source_plan_completed_with_warnings_ready_for_dispatch_source_owner_review",
  "goal": "Plan the source-level dispatch contract adapter without implementing dispatch, claim/lease mutation, route execution enablement, Supabase writes, media processing, artifacts, beta, or production.",
  "requiredInputs": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "attempt",
    "privateManifestRef",
    "runtimeFlags"
  ],
  "reviewScope": {
    "planSourceOnly": true,
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

Use this prompt only after Phase144 is merged. It plans dispatch contract source and does not create or execute dispatch source.
