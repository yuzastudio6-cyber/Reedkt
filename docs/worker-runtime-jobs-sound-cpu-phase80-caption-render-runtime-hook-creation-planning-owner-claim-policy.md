# WORKER_RUNTIME_JOBS SOUND CPU Phase 80 Creation Planning Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-creation-planning-owner-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase80CreationPlanningOwnerReviewPassed": true,
    "creationPreconditionsAccepted": true,
    "privateManifestInstanceShapeAccepted": true,
    "idempotencyKeysAccepted": true,
    "rollbackAndCleanupPolicyAccepted": true,
    "noMediaOpenNoArtifactWriteBoundaryAccepted": true,
    "fixtureInstanceCreationStaticPlanMayProceed": true,
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

This policy allows only owner-review and next-static-plan claims.
