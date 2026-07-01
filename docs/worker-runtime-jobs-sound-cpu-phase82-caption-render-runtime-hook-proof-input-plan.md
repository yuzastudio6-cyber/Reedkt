# WORKER_RUNTIME_JOBS SOUND CPU Phase 82 Proof Input Plan

```json worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "plannedProofInputs": [
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-001",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-001",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-001",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-001:caption-json",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:001:phase80",
      "approvedPlanSnapshotId": "phase82-controlled-proof-plan-only"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-002",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-002",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-002",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-002:caption-vtt",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:002:phase80",
      "approvedPlanSnapshotId": "phase82-controlled-proof-plan-only"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-003",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-003",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-003",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-003:render-manifest",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:003:phase80",
      "approvedPlanSnapshotId": "phase82-controlled-proof-plan-only"
    }
  ],
  "inputPolicy": {
    "inputsContainNoFilesystemPaths": true,
    "inputsContainNoSignedUrls": true,
    "inputsContainNoPublicArtifactUrls": true,
    "inputsContainNoProviderOutputBlobs": true,
    "inputsContainNoSecrets": true
  },
  "executionState": {
    "fixtureInstanceCreatedToday": false,
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false
  }
}
```

The proof inputs are static identifiers only.
