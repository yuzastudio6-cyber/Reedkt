# WORKER_RUNTIME_JOBS SOUND CPU Phase 87 Private Manifest Field Contract Plan

```json worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-manifest-field-contract-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredManifestFieldCategories": {
    "schemaVersion": "sound-cpu-private-media-manifest-v1",
    "approvedPlanSnapshotId": "required_private_reference",
    "workspaceId": "required_private_reference",
    "projectId": "required_private_reference",
    "jobId": "required_private_reference",
    "idempotencyKey": "required_private_reference",
    "workerName": "accepted_sound_cpu_worker_name",
    "jobType": "accepted_sound_cpu_job_type",
    "privateMediaAssetIds": "private_asset_reference_ids_only",
    "plannedPrivateArtifactIds": "planned_private_artifact_reference_ids_only",
    "runtimeDefaults": "all_false"
  },
  "rejectedManifestFieldCategories": {
    "rawPrompt": "rejected",
    "signedUrl": "rejected_as_source_of_truth",
    "publicArtifactUrl": "rejected",
    "providerOutputBlob": "rejected",
    "secretValue": "rejected",
    "serviceRolePayload": "rejected",
    "modelWeightLocation": "rejected",
    "localMediaFilePath": "rejected_for_external_agent_boundary"
  },
  "executionState": {
    "createManifestToday": false,
    "persistManifestToday": false,
    "useRealMediaBytesToday": false,
    "createArtifactToday": false
  }
}
```

The manifest field contract remains private-reference based and does not contain public URLs, secrets, raw prompts, or executable payloads.
