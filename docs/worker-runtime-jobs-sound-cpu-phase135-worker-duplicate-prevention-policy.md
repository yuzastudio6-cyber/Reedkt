# WORKER_RUNTIME_JOBS SOUND CPU Phase 135 Worker Duplicate Prevention Policy

```json worker-runtime-jobs-sound-cpu-phase135-worker-duplicate-prevention-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase135-worker-duplicate-prevention-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review",
  "plannedDuplicatePrevention": {
    "idempotencyKeyRequired": true,
    "uniqueJobClaimConstraintRequired": true,
    "samePurposeDuplicatePrCheckRequired": true,
    "sameMediaDuplicateJobCheckRequired": true,
    "leaseTokenCompareAndSwapRequired": true,
    "resultWriteRequiresMatchingLeaseToken": true
  },
  "duplicatePreventionImplementedToday": false
}
```

Duplicate prevention is planned so external agents do not race the same job when execution is later enabled.
