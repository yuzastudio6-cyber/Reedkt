# SOUND Runtime Media Gate 2Z Runtime Claim Policy

```json sound-runtime-media-gate-2z-runtime-claim-policy
{
  "decision": "sound_runtime_media_gate_2z_blocked_typescript_runtime_loading",
  "allowedClaims": {
    "controlledRouteSourceImportAttempted": true,
    "typescriptRuntimeLoadingBlocked": true,
    "routeSourceImportCompleted": false,
    "resolverInvoked": false,
    "serverRouteExecuted": false,
    "workerExecutionRun": false,
    "mediaProcessingRun": false,
    "supabaseSqlRun": false,
    "artifactCreated": false,
    "routeReadinessClaimed": false,
    "acceptedForBetaOrProduction": false
  },
  "forbiddenClaims": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "server_route_execution_passed",
    "route_readiness_passed",
    "worker_readiness_passed",
    "runtime_readiness_passed",
    "media_readiness_passed",
    "beta_ready",
    "production_ready"
  ],
  "closedGates": {
    "dockerBuildRunPush": true,
    "gcpCloudRunSecretManager": true,
    "workerDispatchExecution": true,
    "mediaFfmpegModel": true,
    "supabaseSql": true,
    "providerModel": true,
    "artifactSignedPublicUrl": true,
    "billingBetaProduction": true
  }
}
```
