# SOUND Runtime Media Gate 2X Runtime Claim Policy

```json sound-runtime-media-gate-2x-runtime-claim-policy
{
  "decision": "sound_runtime_media_gate_2x_controlled_route_resolver_import_proof_passed_with_warnings_ready_for_import_proof_owner_review",
  "allowedClaims": {
    "controlledRouteResolverImportProofPassed": true,
    "routeResolverImportedForProofOnly": true,
    "functionInvoked": false,
    "serverRouteExecuted": false,
    "workerExecutionRun": false,
    "toolExecutionRun": false,
    "mediaProcessingRun": false,
    "supabaseSqlRun": false,
    "artifactCreated": false,
    "routeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaReadinessClaimed": false,
    "productionReadinessClaimed": false
  },
  "forbiddenInGate2x": {
    "serverRouteExecution": true,
    "workerExecution": true,
    "toolExecution": true,
    "mediaProcessing": true,
    "dockerBuildRunPush": true,
    "gcpCloudRunSecretManager": true,
    "supabaseSql": true,
    "providerModelCall": true,
    "artifactOrSignedUrlCreation": true
  }
}
```
