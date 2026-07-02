# WORKER_RUNTIME_JOBS SOUND CPU Phase 143 Disabled Route Response Register

```json worker-runtime-jobs-sound-cpu-phase143-disabled-route-response-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase143-disabled-route-response-register",
  "sharedResponseAssertions": {
    "ok": false,
    "errorCode": "ROUTE_EXECUTION_NOT_ENABLED",
    "accepted": false,
    "reason": "route_execution_not_enabled",
    "routeRegisteredInApp": true,
    "workerDispatchStarted": false,
    "mediaProcessingStarted": false,
    "supabaseMutationStarted": false,
    "sqlExecutionStarted": false,
    "artifactCreated": false
  },
  "staticRuntimeFlagsRemainFalse": {
    "routeExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "storageObjectCreationEnabled": false,
    "signedUrlCreationEnabled": false,
    "publicArtifactCreationEnabled": false,
    "providerModelCallEnabled": false,
    "dockerCloudRunExecutionEnabled": false
  }
}
```

Both disabled responses preserve fail-closed runtime flags.
