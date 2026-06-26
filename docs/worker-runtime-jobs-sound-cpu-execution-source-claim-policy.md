# WORKER_RUNTIME_JOBS SOUND CPU Execution Source Claim Policy

```json worker-runtime-jobs-sound-cpu-execution-source-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_execution_gate_source_owner_review_passed_with_warnings_ready_for_runtime_source_creation_plan",
  "allowedClaims": {
    "gate2adSourcePlanAcceptedForFutureRuntimeSourcePlanning": true,
    "futureRuntimeSourceCreationPlanMayProceed": true,
    "runtimeSourceCreationApprovedToday": false,
    "runtimeSourceEditedToday": false,
    "publicApiChangedToday": false,
    "workerExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "supabaseSqlApprovedToday": false,
    "artifactCreationApprovedToday": false,
    "betaOrProductionReadinessClaimedToday": false
  },
  "forbiddenClaims": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime_ready",
    "worker_ready",
    "media_ready",
    "supabase_ready",
    "beta_ready",
    "production_ready"
  ],
  "closedGates": {
    "workerRouteToolExecution": true,
    "mediaFfmpegModelExecution": true,
    "supabaseSqlStorageSignedUrls": true,
    "artifactCreationDelivery": true,
    "dockerGcpCloudRunSecretManager": true,
    "providerModelCalls": true,
    "billingCreditsStripe": true,
    "betaProductionUnlock": true
  }
}
```
