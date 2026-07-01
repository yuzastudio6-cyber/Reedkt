# WORKER_RUNTIME_JOBS SOUND CPU Phase 81 Creation Static Plan Claim Policy

```json worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase81StaticCreationPlanCompleted": true,
    "staticCreationInputsPlanned": true,
    "staticCreationOutputShapePlanned": true,
    "idempotencyAssertionsPlanned": true,
    "noExecutionGuardsPlanned": true,
    "soundCpuToolsCovered": 15
  },
  "disallowedClaims": {
    "fixtureInstanceCreated": "disallowed",
    "fixtureManifestPersisted": "disallowed",
    "mediaFileOpened": "disallowed",
    "artifactCreated": "disallowed",
    "workerDispatched": "disallowed",
    "routeToolProviderExecuted": "disallowed",
    "supabaseSqlTouched": "disallowed",
    "generatedLocalFixturePassedClaimed": "disallowed",
    "dryRunPassedClaimed": "disallowed",
    "runtimeReadinessClaimed": "disallowed",
    "realUserMediaBetaReadyClaimed": "disallowed",
    "productionReadinessClaimed": "disallowed"
  },
  "executionApprovalsToday": "none"
}
```

Only static planning claims are allowed in this gate.
