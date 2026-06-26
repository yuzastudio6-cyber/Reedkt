# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Result Observability Schema Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-result-observability-schema-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "resultObservabilityFields": [
    "resultStatus",
    "resultCategory",
    "sanitizedErrorCode",
    "sanitizedOwnerSummary",
    "appendOnlyEventId",
    "correlationId",
    "traceId",
    "metricLabels",
    "redactionPolicyVersion",
    "dependencyReadinessSnapshot"
  ],
  "observabilityPolicy": {
    "futureSchemaPlanningOnly": true,
    "resultSchemaApprovedToday": false,
    "observabilityPolicyApprovedToday": false,
    "artifactWriteApprovedToday": false,
    "workerExecutionApprovedToday": false
  }
}
```
