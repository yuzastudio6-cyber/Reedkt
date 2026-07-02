# WORKER_RUNTIME_JOBS SOUND CPU Phase 143 Controlled Disabled Route Request Validation Result

```json worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result
{
  "label": "worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result",
  "decision": "worker_runtime_jobs_sound_cpu_phase143_controlled_disabled_route_request_validation_passed_with_warnings_ready_for_disabled_route_request_owner_review",
  "sourceVerification": {
    "sourcePr": 2159,
    "sourceMergeCommit": "b8d40fd4bbcc532cf8a9e3485ea91d43b48a1b8d",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase142_disabled_route_metadata_aligned_with_warnings_ready_for_controlled_disabled_route_request_validation"
  },
  "proofResult": {
    "localLoopbackOnly": true,
    "postRequestCount": 1,
    "getRequestCount": 1,
    "postStatus": 409,
    "getStatus": 409,
    "postAccepted": false,
    "getAccepted": false,
    "routeRegisteredInApp": true,
    "serverClosed": true,
    "workerDispatchExecutionEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactCreationEnabled": false
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

The proof hit only the local disabled route and verified fail-closed responses.
