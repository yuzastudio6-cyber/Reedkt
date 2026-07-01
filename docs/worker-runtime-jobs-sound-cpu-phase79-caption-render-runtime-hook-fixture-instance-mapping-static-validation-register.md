# WORKER_RUNTIME_JOBS SOUND CPU Phase 79 Fixture Instance Mapping Static Validation Register

```json worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-mapping-static-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "validatedMappings": [
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-001",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-001",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-001",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-001:caption-json"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-002",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-002",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-002",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-002:caption-vtt"
    },
    {
      "fixtureInstanceId": "sound-cpu-caption-render-fixture-instance-003",
      "sourceFixtureId": "sound-cpu-caption-render-fixture-audio-003",
      "privateMediaAssetId": "private-media-asset:sound-cpu:caption-render:fixture-audio-003",
      "plannedPrivateArtifactId": "planned-private-artifact:sound-cpu:caption-render:fixture-audio-003:render-manifest"
    }
  ],
  "staticChecks": {
    "fixtureInstanceCount": 3,
    "privateMediaAssetMappingCount": 3,
    "plannedPrivateArtifactMappingCount": 3,
    "onePrivateMediaAssetPerFixtureInstance": true,
    "onePlannedPrivateArtifactPerFixtureInstance": true,
    "privateMediaAssetIdsUseValidatedPrefix": true,
    "plannedPrivateArtifactIdsUseApprovedKinds": true,
    "mappingOrdinalsMatch": true
  },
  "executionState": {
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false,
    "storageTransferToday": false,
    "signedUrlCreatedToday": false
  }
}
```

Mappings are statically validated identifiers only. No media or artifact operation runs.
