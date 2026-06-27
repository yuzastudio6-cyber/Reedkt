# WORKER_RUNTIME_JOBS SOUND CPU Approved Snapshot Payload Boundary Policy After Runner Boundary Execution Proof

```json worker-runtime-jobs-sound-cpu-approved-snapshot-payload-boundary-policy-after-runner-boundary-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-approved-snapshot-payload-boundary-policy-after-runner-boundary-execution-proof",
  "decision": "worker_runtime_jobs_sound_cpu_approved_snapshot_payload_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof",
  "allowedForFutureInternalBetaPayloadPlanning": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "toolId",
    "attempt metadata",
    "static-only runtime flags"
  ],
  "rejectedPayloadSources": [
    "raw chat",
    "raw prompts",
    "provider prompts",
    "signed URLs as source of truth",
    "public URLs as source of truth",
    "real user media file paths",
    "local file paths",
    "GCS object paths",
    "service-role payloads",
    "database URLs",
    "provider output blobs",
    "model-weight locations",
    "artifact write targets",
    "secrets"
  ],
  "blockedToday": {
    "rawChatExecutionAllowedToday": false,
    "productToolCallExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "artifactDeliveryApprovedToday": false,
    "supabaseSqlApprovedToday": false,
    "dockerGcpApprovedToday": false,
    "billingStripeApprovedToday": false,
    "internalBetaUnlockApprovedToday": false,
    "externalBetaUnlockApprovedToday": false,
    "productionUnlockApprovedToday": false
  }
}
```

The internal beta payload evidence may reference IDs and static metadata only. It must not rely on raw chat, live media, storage URLs, service-role state, provider output, or artifact write destinations.
