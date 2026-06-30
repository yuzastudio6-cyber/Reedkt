# WORKER_RUNTIME_JOBS SOUND CPU Phase 70 Private Manifest Instance Owner Policy Review Register

```json worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-policy-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase70-caption-render-runtime-hook-private-manifest-instance-owner-policy-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase70_caption_render_runtime_hook_private_manifest_instance_owner_review_passed_with_warnings_ready_for_private_manifest_instance_creation_plan_no_media_no_artifacts",
  "acceptedPrivateAssetIdPolicy": {
    "field": "privateMediaAssetIds",
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
  "acceptedPrivateArtifactIdPolicy": {
    "field": "plannedPrivateArtifactIds",
    "idsOnly": true,
    "nonEmptyStringsRequired": true,
    "plannedPlaceholdersOnly": true,
    "artifactWritesAllowedToday": false,
    "storageTransferAllowedToday": false,
    "signedUrlCreationAllowedToday": false,
    "publicArtifactCreationAllowedToday": false,
    "externalArtifactPublicationAllowedToday": false
  },
  "acceptedSourceOfTruthPolicy": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "signedUrlsAreNeverSourceOfTruth": true
  }
}
```

The accepted policies keep media assets and artifacts private-ID based. Signed/public URLs and storage writes remain blocked.
