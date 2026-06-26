# SOUND Runtime Media Gate 2AO Retry Timeout Cancellation Observability Criteria Register

```json sound-runtime-media-gate-2ao-retry-timeout-cancellation-observability-criteria-register
{
  "decision": "sound_runtime_media_gate_2ao_worker_dispatch_contract_approval_criteria_plan_completed_with_warnings_ready_for_worker_dispatch_contract_criteria_owner_review",
  "retryTimeoutCancellationObservabilityCriteria": [
    {
      "criteriaId": "attempt_metadata_required",
      "requirement": "Future criteria must require attemptNumber, maxAttempts, priorFailureCategory, retryEligibility, retryDelayPolicy, and idempotencyKey before retry planning can be accepted.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "timeout_policy_required",
      "requirement": "Future criteria must define queue wait timeout, claim lease timeout, execution timeout, cleanup timeout, and owner-visible timeout categories without starting execution.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "cancellation_policy_required",
      "requirement": "Future criteria must define cancellation request authority, safe cancellation checkpoints, cleanup expectations, and immutable audit events before any worker dispatch is approved.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "result_event_schema_required",
      "requirement": "Future criteria must require sanitized status, result category, non-secret metadata, error code, owner-facing summary, and append-only event semantics.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "observability_policy_required",
      "requirement": "Future criteria must require structured logs, metrics, correlation IDs, sanitized error summaries, and secret/signed-url redaction before execution approval.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "dependency_readiness_required",
      "requirement": "Future criteria must require approved snapshot readiness, job dependency readiness, owner approvals, package/image readiness, storage policy readiness, and billing readiness before dispatch approval.",
      "approvalStatusToday": "criteria_planned_not_approved"
    }
  ],
  "retryPolicyApprovedToday": false,
  "timeoutPolicyApprovedToday": false,
  "cancellationPolicyApprovedToday": false,
  "observabilityPolicyApprovedToday": false,
  "workerExecutionApprovedToday": false
}
```
