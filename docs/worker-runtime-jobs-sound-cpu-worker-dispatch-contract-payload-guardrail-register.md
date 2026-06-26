# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Payload Guardrail Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-payload-guardrail-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "requiredPlaceholderFields": [
    "runtimeFlags",
    "blockedMediaPolicy",
    "privateStorageReferenceIds",
    "supabaseServiceRoleBoundaryStatus",
    "creditReservationReference",
    "ownerApprovalSnapshot"
  ],
  "forbiddenPayloadContents": [
    "raw prompts as source of truth",
    "secrets or API keys",
    "Supabase service-role keys",
    "signed URLs as source of truth",
    "public URLs as source of truth",
    "raw media file paths",
    "provider output blobs",
    "model-weight locations",
    "artifact write targets",
    "SQL text"
  ],
  "guardrailPolicy": {
    "futureSchemaPlanningOnly": true,
    "supabaseMutationApprovedToday": false,
    "artifactWriteApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "providerModelCallApprovedToday": false
  }
}
```
