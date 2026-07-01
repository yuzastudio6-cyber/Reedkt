# WORKER_RUNTIME_JOBS SOUND CPU Phase 81 Creation Static Plan Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-creation-static-plan-owner-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase81StaticCreationPlanOwnerReviewPassed": true,
    "staticCreationInputsAccepted": true,
    "staticCreationOutputShapeAccepted": true,
    "idempotencyAssertionsAccepted": true,
    "noExecutionGuardsAccepted": true,
    "controlledFixtureInstanceCreationProofPlanMayProceed": true,
    "soundCpuToolsCovered": 15
  },
  "disallowedClaims": {
    "controlledFixtureInstanceCreationProofExecuted": "disallowed",
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

This policy allows only owner-review and next proof-plan claims.
