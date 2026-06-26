# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Criteria Acceptance Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan",
  "acceptedCriteriaEvidence": {
    "gate2aoDecisionAccepted": true,
    "dispatchCriteriaCount": 8,
    "retryTimeoutCancellationObservabilityCriteriaCount": 6,
    "acceptedForSchemaPlanningOnly": true,
    "acceptedForDispatchContractApprovalToday": false,
    "acceptedForWorkerDispatchToday": false,
    "acceptedForWorkerExecutionToday": false
  },
  "acceptedPlanningSurface": [
    "approved snapshot and workspace/project/job identity requirements",
    "idempotency key requirements",
    "claim and lease boundary requirements",
    "SOUND CPU job type allowlist requirements",
    "disabled runtime flag requirements",
    "private storage reference requirements",
    "Supabase service-role boundary requirements",
    "credit reservation gate requirements",
    "retry, timeout, cancellation, result event, observability, and dependency readiness requirements"
  ],
  "executionApprovalsGrantedToday": "none"
}
```
