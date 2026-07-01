# WORKER_RUNTIME_JOBS SOUND CPU Phase 92 Controlled Manifest Instance Creation Claim Policy

```json worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "controlledInMemoryManifestInstanceCreationPassed": true,
    "manifestValidationPassed": true,
    "controlledCreationOwnerReviewMayProceed": true,
    "soundCpuToolsCovered": 15
  },
  "blockedClaims": {
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
  "executionApprovalsToday": "controlled_in_memory_manifest_instance_only"
}
```

This policy allows the controlled in-memory proof claim only. It does not claim runtime, beta, or production readiness.
