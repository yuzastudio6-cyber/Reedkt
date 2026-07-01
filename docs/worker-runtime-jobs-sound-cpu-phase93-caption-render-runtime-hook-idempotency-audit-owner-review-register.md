# WORKER_RUNTIME_JOBS SOUND CPU Phase 93 Idempotency Audit Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-owner-review-register",
  "acceptedFutureIdempotencyFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey"
  ],
  "acceptedFutureAuditFields": [
    "createdAt",
    "createdByWorkerGate",
    "sourceDecision",
    "sourcePr",
    "manifestSchemaVersion",
    "validationResult",
    "runtimeDefaultsSnapshot",
    "retentionPolicySnapshot"
  ],
  "auditPoliciesAccepted": {
    "auditEventAppendOnly": true,
    "approvedPlanSnapshotImmutable": true,
    "workerMustUseApprovedSnapshot": true,
    "rawChatExecutionRejected": true,
    "auditWriteImplementationDeferred": true
  }
}
```

Audit planning is accepted, but audit rows are not written in this gate.
