# WORKER_RUNTIME_JOBS SOUND CPU Phase 71 No-Media No-Artifact Fixture Input Register

```json worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-no-media-no-artifact-fixture-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-no-media-no-artifact-fixture-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_plan_completed_with_warnings_ready_for_private_manifest_instance_creation_owner_review_no_media_no_artifacts",
  "plannedFixturePolicy": {
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
  "plannedFixtureInputCategories": [
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
    "fixturePolicyPlanning": true,
    "fixtureFileCreation": false,
    "manifestInstanceCreation": false,
    "mediaRead": false,
    "artifactWrite": false
  }
}
```

Future fixture inputs must be opaque and private-ID based. This gate does not create a fixture file or manifest instance.
