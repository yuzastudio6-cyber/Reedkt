# WORKER_RUNTIME_JOBS SOUND CPU Phase 135 Worker Claim Lease Policy

```json worker-runtime-jobs-sound-cpu-phase135-worker-claim-lease-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase135-worker-claim-lease-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review",
  "plannedLeasePolicy": {
    "singleActiveLeasePerJob": true,
    "leaseTokenRequired": true,
    "leaseExpiryRequired": true,
    "heartbeatPolicyRequired": true,
    "staleLeaseRecoveryRequired": true,
    "idempotentClaimRequired": true,
    "approvedSnapshotRequired": true,
    "privateManifestRequiredForRealMedia": true
  },
  "claimMutationImplementedToday": false,
  "workerDispatchExecutionToday": false
}
```

No claim, lease, heartbeat, or worker dispatch mutation is implemented in this gate.
