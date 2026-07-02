# WORKER_RUNTIME_JOBS SOUND CPU Phase 152 Claim Policy

```json worker-runtime-jobs-sound-cpu-phase152-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase152-claim-policy",
  "allowedClaims": {
    "indexExportPlanAccepted": true,
    "actualIndexExportSourceCreationMayProceed": true
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

Phase152 may claim source-creation approval only.
