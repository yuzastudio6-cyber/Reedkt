# WORKER_RUNTIME_JOBS SOUND CPU Dispatch Contract Approval Closure Claim Policy

```json worker-runtime-jobs-sound-cpu-dispatch-contract-approval-closure-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_completed_with_warnings_ready_for_dispatch_contract_approval_closure_owner_review",
  "allowedClaims": {
    "dispatchContractApprovalClosurePlanCreated": true,
    "futureDispatchContractApprovalClosureOwnerReviewMayProceed": true,
    "requiredOwnerSignoffChecklistCreated": true,
    "evidenceRequirementsRegisterCreated": true,
    "closureOrderRegisterCreated": true,
    "remainingBlockerRegisterCreated": true,
    "closedGapCountToday": 0,
    "schemaApprovedForExecutionToday": false,
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
    "production_readiness_passed",
    "dispatch_contract_approved",
    "worker_dispatch_enabled",
    "claim_lease_enabled"
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
