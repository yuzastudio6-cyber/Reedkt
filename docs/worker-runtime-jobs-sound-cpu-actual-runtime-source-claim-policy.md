# WORKER_RUNTIME_JOBS SOUND CPU Actual Runtime Source Claim Policy

```json worker-runtime-jobs-sound-cpu-actual-runtime-source-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_actual_runtime_source_owner_review_passed_with_warnings_ready_for_runtime_source_static_integration_plan",
  "allowedClaims": {
    "actualRuntimeSourceAcceptedForStaticIntegrationPlanning": true,
    "futureStaticIntegrationPlanMayProceed": true,
    "runtimeExecutionEnabledToday": false,
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
