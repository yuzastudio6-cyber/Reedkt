# WORKER_RUNTIME_JOBS SOUND CPU Phase 78 Fixture Instance Planning Claim Policy

```json worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase78-caption-render-runtime-hook-fixture-instance-planning-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase78FixtureInstancePlanningCompleted": true,
    "fixtureInstanceIdsPlanned": true,
    "fixtureInstanceMappingsPlanned": true,
    "fixtureInstanceStaticValidationPlanCreated": true,
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

Phase 78 may claim instance planning only. It may not claim instance creation or execution readiness.
