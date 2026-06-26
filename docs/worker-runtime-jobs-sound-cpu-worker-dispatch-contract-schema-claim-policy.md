# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Schema Claim Policy

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "allowedClaims": {
    "workerDispatchContractSchemaPlanCreated": true,
    "futureWorkerDispatchContractSchemaOwnerReviewMayProceed": true,
    "schemaSectionCount": 6,
    "closedGapCountToday": 0,
    "schemaApprovedToday": false,
    "dispatchContractApprovedToday": false,
    "workerDispatchApprovedToday": false,
    "claimLeaseApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "runtimeExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "supabaseSqlApprovedToday": false,
    "artifactDeliveryApprovedToday": false,
    "billingBetaProductionApprovedToday": false,
    "runtimeReadinessClaimedToday": false,
    "betaProductionReadinessClaimedToday": false
  },
  "forbiddenClaims": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime_readiness_passed",
    "worker_readiness_passed",
    "media_readiness_passed",
    "beta_readiness_passed",
    "production_readiness_passed"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
