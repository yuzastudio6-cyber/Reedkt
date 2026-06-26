# WORKER_RUNTIME_JOBS SOUND CPU Runtime Source Claim Policy

```json worker-runtime-jobs-sound-cpu-runtime-source-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_runtime_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_runtime_source_creation_gate",
  "allowedClaims": {
    "gate2aeRuntimeSourceCreationPlanAcceptedForFutureSourceGate": true,
    "actualRuntimeSourceCreationMayProceedInFutureGate": true,
    "actualRuntimeSourceCreatedToday": false,
    "actualRuntimeSourceEditedToday": false,
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
