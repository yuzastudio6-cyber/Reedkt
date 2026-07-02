# WORKER_RUNTIME_JOBS SOUND CPU Phase183 Worker Dispatch Blocker Map

```json worker-runtime-jobs-sound-cpu-phase183-worker-dispatch-blocker-map
{
  "label": "worker-runtime-jobs-sound-cpu-phase183-worker-dispatch-blocker-map",
  "blockedDispatchSurfaces": {
    "workerDispatchExecutionEnabled": false,
    "claimLeaseMutationEnabled": false,
    "jobStatusMutationEnabled": false,
    "routeExecutionEnabled": false,
    "toolExecutionEnabled": false,
    "providerCallEnabled": false,
    "modelCallEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactCreationEnabled": false
  },
  "futureOwnerGatesRequired": [
    "runtime_disabled_flag_static_validation",
    "worker_dispatch_claim_lease_owner_review",
    "route_handler_invocation_owner_review",
    "supabase_sql_storage_owner_review",
    "artifact_policy_owner_review"
  ],
  "acceptedForDispatchToday": false
}
```
