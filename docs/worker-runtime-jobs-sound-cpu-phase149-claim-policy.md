# WORKER_RUNTIME_JOBS SOUND CPU Phase 149 Claim Policy

```json worker-runtime-jobs-sound-cpu-phase149-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase149-claim-policy",
  "allowedClaims": {
    "dispatchContractSourceAccepted": true,
    "staticImportValidationMayProceed": true,
    "failClosedSourceAccepted": true
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

Phase149 authorizes the next static import validation gate only.
