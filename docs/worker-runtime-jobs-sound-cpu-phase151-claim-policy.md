# WORKER_RUNTIME_JOBS SOUND CPU Phase 151 Claim Policy

```json worker-runtime-jobs-sound-cpu-phase151-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase151-claim-policy",
  "allowedClaims": {
    "indexExportPlanned": true,
    "indexExportOwnerReviewMayProceed": true
  },
  "blockedClaims": {
    "indexExportAdded": false,
    "workerDispatchExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "toolExecutionEnabled": false,
    "providerCallEnabled": false,
    "modelCallEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactCreationEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "generatedLocalFixturePassed": false,
    "dryRunPassed": false,
    "workerReadiness": false,
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

Phase151 may claim an index export plan only.
