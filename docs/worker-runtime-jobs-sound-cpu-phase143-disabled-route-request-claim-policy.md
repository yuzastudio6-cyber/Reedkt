# WORKER_RUNTIME_JOBS SOUND CPU Phase 143 Disabled Route Request Claim Policy

```json worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-claim-policy",
  "allowedClaims": {
    "controlledDisabledPostRequestReturned409": true,
    "controlledDisabledGetRequestReturned409": true,
    "disabledRouteRequestOwnerReviewMayProceed": true
  },
  "blockedClaims": {
    "routeRequestExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "workerRuntimeReadinessClaimed": false,
    "toolRuntimeExecutionAgainstUserAssetsEnabled": false,
    "realUserMediaBetaEnabled": false,
    "paidProductionEnabled": false,
    "mediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "storageObjectCreationEnabled": false,
    "signedUrlCreationEnabled": false,
    "publicArtifactCreationEnabled": false,
    "creditMutationEnabled": false,
    "generatedLocalFixturePassed": false,
    "dryRunPassed": false
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

Only disabled-route response validation is claimed.
