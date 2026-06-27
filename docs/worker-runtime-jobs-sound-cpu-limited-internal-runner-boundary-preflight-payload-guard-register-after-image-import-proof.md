# WORKER_RUNTIME_JOBS SOUND CPU Limited Internal Runner Boundary Preflight Payload Guard Register After Image Import Proof

```json worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_owner_review_after_image_import_proof",
  "requiredFutureSyntheticPayloadFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "toolId",
    "workerName",
    "imageName",
    "runtimeFlags"
  ],
  "runtimeFlagsRequiredFalse": [
    "REEDITPRO_WORKER_EXECUTION_ENABLED",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED"
  ],
  "forbiddenPayloadFamilies": [
    "rawPrompt",
    "mediaFilePath",
    "mediaFileOpenRequest",
    "mediaProcessingRequest",
    "artifactWriteTarget",
    "signedUrlRequest",
    "publicArtifactRequest",
    "supabaseWriteIntent",
    "sqlStatement",
    "providerModelRequest",
    "secretReference",
    "serviceRolePayload",
    "dockerRunRequest",
    "gcpCloudRunRequest"
  ],
  "counts": {
    "requiredFutureSyntheticPayloadFieldCount": 9,
    "runtimeFlagsRequiredFalseCount": 3,
    "forbiddenPayloadFamilyCount": 14
  }
}
```
