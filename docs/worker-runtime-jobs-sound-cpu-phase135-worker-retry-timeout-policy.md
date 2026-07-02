# WORKER_RUNTIME_JOBS SOUND CPU Phase 135 Worker Retry Timeout Policy

```json worker-runtime-jobs-sound-cpu-phase135-worker-retry-timeout-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase135-worker-retry-timeout-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review",
  "plannedRetryPolicy": {
    "maxAttemptsRequiresOwnerApproval": true,
    "retryableFailureClasses": [
      "temporary_dependency_unavailable",
      "lease_expired_before_execution",
      "transient_worker_startup_failure"
    ],
    "terminalFailureClasses": [
      "missing_approved_snapshot",
      "missing_private_media_manifest",
      "missing_consent",
      "forbidden_media_class",
      "forbidden_runtime_gate",
      "safety_scan_failed"
    ],
    "timeoutPolicyRequired": true,
    "retryBudgetRequired": true
  },
  "retryExecutionToday": false
}
```

Retry and timeout behavior is planned for a later execution owner gate.
