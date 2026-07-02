# WORKER_RUNTIME_JOBS SOUND CPU Phase160 Claim Policy

```json worker-runtime-jobs-sound-cpu-phase160-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase160-claim-policy",
  "allowedClaims": {
    "disabledRouteSourceStaticValidationPassed": true,
    "staticRouteSourceImportSucceeded": true,
    "safePayloadAcceptedByStaticContract": true,
    "safePayloadAcceptedForDispatch": false,
    "blockedPayloadRejected": true,
    "assertionThrows": true
  },
  "blockedClaims": {
    "routeRegistered": false,
    "indexExportAdded": false,
    "acceptedForDispatch": false,
    "workerDispatchExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "toolExecutionEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactCreationEnabled": false,
    "dockerBuildEnabled": false,
    "gcpCloudRunEnabled": false,
    "generatedLocalFixturePassed": false,
    "dryRunPassed": false,
    "runtimeReadiness": false,
    "realUserMediaBetaEnabled": false,
    "paidProductionEnabled": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
