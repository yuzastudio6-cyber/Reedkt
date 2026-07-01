# WORKER_RUNTIME_JOBS SOUND CPU Phase 90 Static Validation Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-static-validation-owner-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "privateManifestInstanceStaticValidationOwnerReviewPassed": true,
    "phase90StaticValidationAccepted": true,
    "controlledManifestInstanceCreationPlanningMayProceed": true,
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

This claim policy allows only owner-review acceptance and the next planning gate.
