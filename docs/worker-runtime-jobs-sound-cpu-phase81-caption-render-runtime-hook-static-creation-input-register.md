# WORKER_RUNTIME_JOBS SOUND CPU Phase 81 Static Creation Input Register

```json worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-static-creation-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "plannedStaticCreationInputs": [
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-001",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-001",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-001",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-001:caption-json",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:001:phase80",
      "approvedPlanSnapshotId": "phase81-static-plan-only"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-002",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-002",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-002",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-002:caption-vtt",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:002:phase80",
      "approvedPlanSnapshotId": "phase81-static-plan-only"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-003",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-003",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-003",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-003:render-manifest",
      "idempotencyKey": "sound-cpu:caption-render:fixture-instance:003:phase80",
      "approvedPlanSnapshotId": "phase81-static-plan-only"
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

The input register is a static plan and not an instance manifest.
