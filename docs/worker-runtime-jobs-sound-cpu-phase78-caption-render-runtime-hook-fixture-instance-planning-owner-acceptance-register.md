# WORKER_RUNTIME_JOBS SOUND CPU Phase 78 Fixture Instance Planning Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDocs": [
    "docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-register.md",
    "docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-media-artifact-mapping-register.md",
    "docs/worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-static-validation-plan.md"
  ],
  "acceptedPlanningCounts": {
    "fixtureInstances": 3,
    "privateMediaAssetMappings": 3,
    "plannedPrivateArtifactMappings": 3
  },
  "acceptedPlanningProperties": {
    "fixtureInstanceIdsAreUnique": true,
    "fixtureInstanceIdsUseApprovedPrefix": true,
    "sourceFixtureIdsUseValidatedPrefix": true,
    "privateMediaAssetIdsUseValidatedPrefix": true,
    "plannedPrivateArtifactIdsUseApprovedKinds": true,
    "rawPathsUrlsProviderBlobsRemainRejected": true
  },
  "acceptedNextGateOnly": {
    "fixtureInstanceStaticValidation": true,
    "fixtureInstanceCreation": false,
    "mediaOpen": false,
    "artifactCreation": false,
    "workerDispatch": false,
    "supabaseSql": false
  }
}
```

The accepted planning surface is limited to static validation of identifiers and mappings.
