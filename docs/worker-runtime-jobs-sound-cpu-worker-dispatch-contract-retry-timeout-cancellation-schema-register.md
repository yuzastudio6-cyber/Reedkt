# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Retry Timeout Cancellation Schema Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-retry-timeout-cancellation-schema-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "retryTimeoutCancellationFields": [
    "priorFailureCategory",
    "retryEligibility",
    "retryDelayPolicy",
    "queueWaitTimeoutSeconds",
    "claimLeaseTimeoutSeconds",
    "executionTimeoutSeconds",
    "cleanupTimeoutSeconds",
    "cancellationRequested",
    "cancellationRequestedBy",
    "cancellationCheckpointPolicy"
  ],
  "retryTimeoutCancellationPolicy": {
    "futureSchemaPlanningOnly": true,
    "retryPolicyApprovedToday": false,
    "timeoutPolicyApprovedToday": false,
    "cancellationPolicyApprovedToday": false,
    "workerExecutionApprovedToday": false
  }
}
```
