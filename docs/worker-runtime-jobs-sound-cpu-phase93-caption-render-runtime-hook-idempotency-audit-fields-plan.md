# WORKER_RUNTIME_JOBS SOUND CPU Phase 93 Idempotency And Audit Fields Plan

```json worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan",
  "requiredFutureIdempotencyFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey"
  ],
  "requiredFutureAuditFields": [
    "createdAt",
    "createdByWorkerGate",
    "sourceDecision",
    "sourcePr",
    "manifestSchemaVersion",
    "validationResult",
    "runtimeDefaultsSnapshot",
    "retentionPolicySnapshot"
  ],
  "auditPolicy": {
    "auditEventAppendOnly": true,
    "approvedPlanSnapshotImmutable": true,
    "workerMustUseApprovedSnapshot": true,
    "rawChatExecutionRejected": true,
    "auditWriteImplementationDeferred": true
  }
}
```

Future persistence must be idempotent and auditable, but no audit rows are written in Phase 93.
