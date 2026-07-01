# WORKER_RUNTIME_JOBS SOUND CPU Phase 90 Private Manifest Instance Static Validation Claim Policy

```json worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-private-manifest-instance-static-validation-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "privateManifestInstanceStaticValidationPassed": true,
    "syntheticInMemoryValidationPassed": true,
    "privateManifestInstanceStaticValidationOwnerReviewMayProceed": true,
    "soundCpuToolsCovered": 15
  },
  "blockedClaims": {
    "manifestInstanceCreatedToday": false,
    "manifestInstancePersistedToday": false,
    "realMediaBytesUsedToday": false,
    "mediaFileOpenedToday": false,
    "artifactCreatedToday": false,
    "signedUrlCreatedToday": false,
    "workerDispatchedToday": false,
    "routeToolProviderExecutedToday": false,
    "supabaseSqlTouchedToday": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "realUserMediaBetaReadyClaimed": false,
    "productionReadinessClaimed": false
  },
  "executionApprovalsToday": "none"
}
```

This claim policy allows only static validation and owner-review readiness claims.
