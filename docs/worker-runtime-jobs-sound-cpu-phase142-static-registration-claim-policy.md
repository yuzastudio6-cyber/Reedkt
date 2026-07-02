# WORKER_RUNTIME_JOBS SOUND CPU Phase 142 Static Registration Claim Policy

```json worker-runtime-jobs-sound-cpu-phase142-static-registration-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-static-registration-claim-policy",
  "allowedClaims": {
    "disabledRouteRegisteredInAppSource": true,
    "staticRegistrationValidationPassed": true,
    "disabledRouteOwnerReviewMayProceed": true
  },
  "blockedClaims": {
    "httpRouteRequestExecuted": false,
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

Only source registration and static validation are claimed.
