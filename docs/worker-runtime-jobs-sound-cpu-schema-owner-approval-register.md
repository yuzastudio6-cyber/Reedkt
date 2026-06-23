# WORKER_RUNTIME_JOBS SOUND CPU Schema Owner Approval Register

This register accepts the static schema categories from PR #672 for future planning. It does not add runtime schema types, persistence schemas, queue tables, route contracts, or worker implementation code.

```json worker-runtime-jobs-sound-cpu-schema-owner-approval-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW",
  "decision": "worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "schemaImplementationAdded": false,
  "acceptedForExecutionToday": "none",
  "acceptedSchemaRows": [
    {
      "jobType": "sound.package_import_smoke",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "payloadSchemaCategory": "package_manifest_metadata",
      "resultSchemaCategory": "import_availability_summary",
      "approvedForStaticPlanning": true,
      "approvedForRuntimeSchemaImplementation": false
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "payloadSchemaCategory": "synthetic_in_memory_numeric_arrays",
      "resultSchemaCategory": "synthetic_analysis_metrics",
      "approvedForStaticPlanning": true,
      "approvedForRuntimeSchemaImplementation": false
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "payloadSchemaCategory": "synthetic_symbolic_midi_like_data",
      "resultSchemaCategory": "symbolic_metadata_summary",
      "approvedForStaticPlanning": true,
      "approvedForRuntimeSchemaImplementation": false
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "payloadSchemaCategory": "synthetic_in_memory_loudness_samples",
      "resultSchemaCategory": "loudness_metadata_summary",
      "approvedForStaticPlanning": true,
      "approvedForRuntimeSchemaImplementation": false
    }
  ],
  "requiredStaticFieldsAccepted": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "attempt",
    "maxAttempts",
    "staticRuntimeFlags"
  ],
  "placeholderPoliciesAcceptedAsPlaceholdersOnly": [
    "dispatch",
    "claim",
    "lease",
    "retry",
    "timeout",
    "idempotency",
    "observability",
    "cost",
    "artifact",
    "supabase"
  ],
  "unsafePayloadSourcesRejected": [
    "raw prompts",
    "signed URLs as source of truth",
    "media file paths",
    "provider output blobs",
    "secrets",
    "service-role payloads",
    "model-weight locations",
    "artifact write targets"
  ],
  "runtimeFlags": {
    "workerExecutionRun": false,
    "routeExecutionRun": false,
    "toolExecutionRun": false,
    "dockerBuildRun": false,
    "mediaProcessingRun": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "artifactCreated": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false
  }
}
```
