# WORKER_RUNTIME_JOBS SOUND CPU Phase 91 Controlled Manifest Instance Creation Planning Claim Policy

```json worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase91-caption-render-runtime-hook-controlled-manifest-instance-creation-planning-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "controlledManifestInstanceCreationPlanningCompleted": true,
    "controlledManifestInstanceCreationOwnerReviewMayProceed": true,
    "phase90OwnerReviewConsumed": true,
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

This policy allows a planning-complete claim only. Creation, persistence, real media, artifact, dispatch, beta, and production claims remain blocked.
