# WORKER_RUNTIME_JOBS SOUND CPU Phase 70 Private Asset ID Policy Register

```json worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-asset-id-policy-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-private-asset-id-policy-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_plan_completed_with_warnings_ready_for_private_manifest_instance_owner_review_no_media_no_artifacts",
  "field": "privateMediaAssetIds",
  "policy": {
    "idsOnly": true,
    "nonEmptyStringsRequired": true,
    "rawFilePathsAllowed": false,
    "signedUrlsAllowedAsSourceOfTruth": false,
    "publicUrlsAllowedAsSourceOfTruth": false,
    "providerOutputBlobsAllowed": false,
    "secretValuesAllowed": false,
    "serviceRolePayloadsAllowed": false,
    "modelWeightLocationsAllowed": false
  },
  "sourceOfTruth": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "privateStorageResolutionDeferred": true
  },
  "todayAllowed": {
    "policyPlanning": true,
    "readMediaBytes": false,
    "openMediaFile": false,
    "createSignedUrl": false,
    "createPublicUrl": false,
    "storageTransfer": false,
    "workerExecution": false
  }
}
```

Private media asset IDs are planned as opaque identifiers only. Real media resolution remains a later gate.
