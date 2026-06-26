# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Claim Lease Schema Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-claim-lease-schema-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "claimLeaseSchemaFields": [
    "claimId",
    "claimOwner",
    "claimStatus",
    "leaseId",
    "leaseStartedAt",
    "leaseExpiresAt",
    "heartbeatCadenceSeconds",
    "lastHeartbeatAt",
    "staleClaimRecoveryPolicy",
    "duplicateClaimRejectionPolicy"
  ],
  "claimLeasePolicy": {
    "futureSchemaPlanningOnly": true,
    "claimLeaseApprovedToday": false,
    "workerDispatchApprovedToday": false,
    "workerExecutionApprovedToday": false
  }
}
```
