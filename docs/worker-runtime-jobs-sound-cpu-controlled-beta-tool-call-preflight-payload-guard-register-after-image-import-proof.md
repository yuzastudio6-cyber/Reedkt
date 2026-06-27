# WORKER_RUNTIME_JOBS SOUND CPU Controlled Beta Tool-Call Preflight Payload Guard Register After Image Import Proof

```json worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-payload-guard-register-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-payload-guard-register-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_after_image_import_proof_completed_with_warnings_ready_for_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof",
  "allowedPlanningFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "toolId",
    "syntheticInputId",
    "attempt",
    "runtimeFlags"
  ],
  "requiredFalseRuntimeFlags": {
    "mediaFileOpenEnabled": false,
    "artifactWriteEnabled": false,
    "workerExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "providerModelCallEnabled": false,
    "supabaseSqlEnabled": false,
    "dockerGcpEnabled": false,
    "externalBetaEnabled": false,
    "productionEnabled": false
  },
  "forbiddenPayloadFields": [
    "rawPrompt",
    "mediaFilePath",
    "signedUrl",
    "publicUrl",
    "serviceRolePayload",
    "providerOutputBlob",
    "modelWeightPath",
    "artifactWriteTarget",
    "supabaseMutation",
    "sqlStatement"
  ],
  "stopConditions": [
    "media_path_detected",
    "signed_or_public_url_detected",
    "artifact_target_detected",
    "worker_route_execution_requested",
    "supabase_or_sql_requested",
    "provider_or_model_call_requested",
    "external_beta_or_production_claim_detected"
  ]
}
```
