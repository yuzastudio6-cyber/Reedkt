# WORKER_RUNTIME_JOBS SOUND CPU Phase 134 Private Media Manifest Schema Plan

```json worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-schema-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-schema-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_plan_completed_with_warnings_ready_for_manifest_owner_review",
  "plannedManifestFields": {
    "approvedPlanSnapshotId": "required_placeholder",
    "workspaceId": "required_placeholder",
    "projectId": "required_placeholder",
    "jobId": "required_placeholder",
    "idempotencyKey": "required_placeholder",
    "mediaAssetId": "required_placeholder",
    "sourceMediaClass": "owned_user_media_beta_candidate",
    "consentRecordId": "required_placeholder",
    "retentionPolicyId": "required_placeholder",
    "deletionPolicyId": "required_placeholder",
    "privateStorageRef": "placeholder_only",
    "contentHash": "future_required",
    "mimeType": "future_required",
    "durationMs": "future_optional",
    "byteSize": "future_required",
    "createdAt": "future_required",
    "expiresAt": "future_required"
  },
  "forbiddenManifestFields": [
    "raw_prompt",
    "service_role_secret",
    "provider_credential",
    "public_url_as_source_of_truth",
    "signed_url_as_source_of_truth",
    "local_absolute_user_path",
    "model_weight_location",
    "artifact_write_target"
  ],
  "schemaImplementedToday": false
}
```

The manifest schema is a planning contract only. It does not add database tables, storage keys, or runtime code.
