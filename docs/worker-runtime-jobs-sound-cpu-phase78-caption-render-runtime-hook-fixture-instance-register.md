# WORKER_RUNTIME_JOBS SOUND CPU Phase 78 Fixture Instance Register

```json worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "fixtureInstanceSet": {
    "fixtureInstanceSetId": "sound-cpu-caption-render-runtime-hook-limited-fixture-instance-set-001",
    "schemaVersion": "phase78.fixture-instance-plan.v1",
    "manifestBackedOnly": true,
    "sourceOfTruth": "future_private_manifest_instance",
    "rawMediaPathsAllowed": false,
    "signedUrlsAllowedAsSourceOfTruth": false,
    "providerOutputBlobsAllowed": false
  },
  "plannedFixtureInstances": [
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-001",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-001",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-001",
      "plannedPrivateArtifactIds": [
        "planned-private-artifact:sound-cpu:caption-render:fixture-audio-001:caption-json"
      ]
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-002",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-002",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-002",
      "plannedPrivateArtifactIds": [
        "planned-private-artifact:sound-cpu:caption-render:fixture-audio-002:caption-vtt"
      ]
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-003",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-003",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-003",
      "plannedPrivateArtifactIds": [
        "planned-private-artifact:sound-cpu:caption-render:fixture-audio-003:render-manifest"
      ]
    }
  ],
  "runtimeState": {
    "fixtureInstancesCreatedToday": false,
    "fixtureManifestPersistedToday": false,
    "realMediaBytesAttachedToday": false,
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false,
    "workerDispatchedToday": false
  }
}
```

The fixture instance entries are planning records only. They are not persisted manifest rows.
