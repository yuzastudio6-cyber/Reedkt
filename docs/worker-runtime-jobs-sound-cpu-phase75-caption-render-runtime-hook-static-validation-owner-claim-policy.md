# WORKER_RUNTIME_JOBS SOUND CPU Phase 75 Static Validation Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-static-validation-owner-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase75StaticValidationOwnerReviewPassed": true,
    "limitedRealMediaFixturePlanningMayProceed": true,
    "soundCpuToolsCovered": 15
  },
  "disallowedClaims": {
    "realMediaUsed": true,
    "mediaFileOpened": true,
    "artifactCreated": true,
    "workerDispatched": true,
    "routeToolProviderCalled": true,
    "supabaseSqlTouched": true,
    "dockerGcpActionEnabled": true,
    "externalBetaUnlocked": true,
    "productionUnlocked": true,
    "generatedLocalFixturePassedClaimed": true,
    "dryRunPassedClaimed": true,
    "runtimeReadinessClaimed": true
  },
  "executionApprovalsToday": "none"
}
```

The owner-review claim is narrow: fixture planning may proceed, but real execution remains unapproved.
