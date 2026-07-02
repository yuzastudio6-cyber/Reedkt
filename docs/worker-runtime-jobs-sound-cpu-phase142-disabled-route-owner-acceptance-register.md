# WORKER_RUNTIME_JOBS SOUND CPU Phase 142 Disabled Route Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-disabled-route-owner-acceptance-register",
  "acceptedEvidence": {
    "serverAppImportValidated": true,
    "serverAppMountValidated": true,
    "mountCount": 1,
    "routeExecutionFlagFalse": true,
    "disabledStatusValidated": 409,
    "httpRouteRequestExecutedInSourceGate": false
  },
  "acceptedForNextGateOnly": {
    "oneLocalDisabledPostRequest": true,
    "oneLocalDisabledGetRequest": true,
    "expectedHttpStatus": 409,
    "expectedRouteAccepted": false,
    "expectedRouteReason": "route_execution_not_enabled"
  },
  "notAcceptedForExecution": {
    "workerDispatchExecutionEnabled": false,
    "workerLeaseOrClaimMutationEnabled": false,
    "toolRuntimeExecutionAgainstUserAssetsEnabled": false,
    "realUserMediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "storageObjectCreationEnabled": false,
    "signedUrlCreationEnabled": false,
    "publicArtifactCreationEnabled": false,
    "creditMutationEnabled": false,
    "paidProductionEnabled": false
  }
}
```

The next gate may hit only the disabled route response locally and must not dispatch work.
