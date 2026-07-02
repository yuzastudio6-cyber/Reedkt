# WORKER_RUNTIME_JOBS SOUND CPU Phase 135 Worker Dispatch State Machine Plan

```json worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-state-machine-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-state-machine-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review",
  "plannedStates": [
    "queued",
    "claim_pending",
    "claimed",
    "running",
    "succeeded",
    "failed_retryable",
    "failed_terminal",
    "expired",
    "cancelled"
  ],
  "requiredClaimFields": {
    "approvedPlanSnapshotId": "required",
    "jobId": "required",
    "idempotencyKey": "required",
    "workerName": "required",
    "workerImage": "required",
    "jobType": "required",
    "leaseToken": "future_required",
    "leaseExpiresAt": "future_required",
    "attemptNumber": "future_required"
  },
  "stateMachineImplementedToday": false
}
```

The state machine is a planning contract, not a runtime job table or worker implementation.
