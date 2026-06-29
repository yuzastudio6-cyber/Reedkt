# WORKER_RUNTIME_JOBS SOUND CPU Phase 37P Caption Render Runtime Hook Blocked-State Source Claim Policy

```json worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "allowedClaims": {
    "phase37PSourceCreated": true,
    "blockedStateIntegrationSourceCreated": true,
    "indexExportUpdated": true,
    "sourceOwnerReviewReady": true,
    "runtimeRemainsFailClosed": true
  },
  "forbiddenClaims": {
    "hookExecuted": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "runtimeReadiness": false,
    "workerReadiness": false,
    "mediaReadiness": false,
    "dockerImageReadiness": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "executionClaims": {
    "dockerBuild": false,
    "dockerRun": false,
    "dockerPush": false,
    "gcpCloudRun": false,
    "workerDispatch": false,
    "routeExecution": false,
    "toolExecution": false,
    "providerModelCall": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseSql": false
  }
}
```

Phase 37P may claim source creation only. It must not claim runtime, media, beta, or production readiness.
