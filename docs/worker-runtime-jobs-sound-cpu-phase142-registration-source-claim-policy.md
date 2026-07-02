# WORKER_RUNTIME_JOBS SOUND CPU Phase 142 Registration Source Claim Policy

```json worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-registration-source-claim-policy",
  "allowedClaims": {
    "disabledRouteRegisteredInAppSource": true,
    "staticRegistrationValidationMayProceed": true
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

This gate claims only disabled source registration and the next static validation handoff.
