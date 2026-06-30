# WORKER_RUNTIME_JOBS SOUND CPU Phase 71 Private Manifest Fixture Input Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-fixture-input-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-fixture-input-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_controlled_private_manifest_instance_creation_no_media_no_artifacts",
  "acceptedFixturePolicy": {
    "fixtureInputsAllowedInFutureGate": true,
    "concreteFixtureCreatedToday": false,
    "privateMediaAssetIdsAreOpaqueIdsOnly": true,
    "plannedPrivateArtifactIdsAreOpaqueIdsOnly": true,
    "realMediaPathsAllowed": false,
    "signedUrlsAllowed": false,
    "publicUrlsAllowed": false,
    "storageObjectWritesAllowed": false,
    "providerOutputAllowed": false,
    "modelWeightReferencesAllowed": false,
    "secretsAllowed": false
  },
  "acceptedFixtureInputCategories": [
    "synthetic approvedPlanSnapshotId string",
    "synthetic workspaceId string",
    "synthetic projectId string",
    "synthetic jobId string",
    "synthetic idempotencyKey string",
    "accepted workerName",
    "accepted jobType",
    "opaque privateMediaAssetIds",
    "opaque plannedPrivateArtifactIds",
    "all runtime defaults false"
  ],
  "todayAllowed": {
    "ownerReview": true,
    "controlledNoMediaFixtureInputNext": true,
    "realMediaRead": false,
    "artifactWrite": false,
    "supabaseSql": false
  }
}
```

Future controlled fixture inputs are accepted only as opaque IDs with all runtime defaults false.
