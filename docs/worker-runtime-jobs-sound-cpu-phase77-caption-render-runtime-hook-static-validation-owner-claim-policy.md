# WORKER_RUNTIME_JOBS SOUND CPU Phase 77 Static Validation Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-static-validation-owner-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase77StaticValidationOwnerReviewPassed": true,
    "limitedFixtureInstancePlanningMayProceed": true,
    "fixtureStaticValidationAccepted": true,
    "soundCpuToolsCovered": 15
  },
  "disallowedClaims": {
    "fixtureInstanceCreated": "disallowed",
    "realMediaUsed": "disallowed",
    "mediaFileOpened": "disallowed",
    "artifactCreated": "disallowed",
    "manifestPersisted": "disallowed",
    "workerDispatched": "disallowed",
    "routeToolProviderCalled": "disallowed",
    "supabaseSqlTouched": "disallowed",
    "externalBetaUnlocked": "disallowed",
    "productionUnlocked": "disallowed",
    "generatedLocalFixturePassedClaimed": "disallowed",
    "dryRunPassedClaimed": "disallowed",
    "runtimeReadinessClaimed": "disallowed"
  },
  "executionApprovalsToday": "none"
}
```

The owner-review claim is narrow: instance planning may proceed, but real execution remains unapproved.
