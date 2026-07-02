# WORKER_RUNTIME_JOBS SOUND CPU Phase 136 Route Auth Idempotency Owner Register

```json worker-runtime-jobs-sound-cpu-phase136-route-auth-idempotency-owner-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase136-route-auth-idempotency-owner-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_owner_review_passed_with_warnings_ready_for_supabase_private_storage_rls_plan",
  "acceptedFuturePreconditions": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "privateMediaManifestIdRequired": true,
    "claimLeasePlanAcceptedRequired": true,
    "workersExecuteApprovedSnapshotOnly": true
  },
  "rejectedPayloadSources": {
    "rawPromptPayload": true,
    "signedUrlAsSourceOfTruth": true,
    "publicArtifactTarget": true,
    "clientSuppliedServiceRolePayload": true,
    "modelWeightLocationFromClient": true,
    "secretValueFromClient": true
  },
  "blockedToday": {
    "routeExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "artifactCreationEnabled": false
  }
}
```

The route boundary must remain snapshot-bound, idempotent, and fail-closed before later source work can proceed.
