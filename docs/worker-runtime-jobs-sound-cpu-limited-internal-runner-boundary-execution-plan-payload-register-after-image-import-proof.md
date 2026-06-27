# WORKER_RUNTIME_JOBS SOUND CPU Limited Internal Runner Boundary Execution Plan Payload Register After Image Import Proof

```json worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-plan-payload-register-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_execution_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_execution_owner_review_after_image_import_proof",
  "requiredFutureSyntheticPayloadFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "toolId"
  ],
  "runtimeFlagsRequiredFalse": [
    "runtimeEnabled",
    "mediaProcessingEnabled",
    "artifactWritesEnabled"
  ],
  "permittedPayloadTraitsForFutureProofOnly": [
    "synthetic_in_memory_payload",
    "no_media_file_open",
    "no_artifact_target",
    "no_provider_request",
    "no_supabase_write_intent",
    "no_route_or_worker_dispatch"
  ],
  "forbiddenPayloadFamilies": [
    "rawPrompt",
    "mediaFilePath",
    "uploadedMediaReference",
    "signedUrl",
    "artifactWriteTarget",
    "supabaseWriteIntent",
    "sqlStatement",
    "providerModelRequest",
    "dockerRunRequest",
    "gcpCloudRunRequest",
    "secretManagerReference",
    "billingCreditMutation",
    "routeExecutionRequest",
    "workerDispatchRequest"
  ],
  "counts": {
    "requiredFutureSyntheticPayloadFieldCount": 9,
    "runtimeFlagsRequiredFalseCount": 3,
    "forbiddenPayloadFamilyCount": 14,
    "permittedProductPayloadFamilyCountToday": 0
  }
}
```
