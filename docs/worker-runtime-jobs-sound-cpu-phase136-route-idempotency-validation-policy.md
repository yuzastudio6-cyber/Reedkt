# WORKER_RUNTIME_JOBS SOUND CPU Phase 136 Route Idempotency Validation Policy

```json worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_plan_completed_with_warnings_ready_for_route_boundary_owner_review",
  "futureIdempotencyRequirements": {
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "approvedPlanSnapshotIdRequired": true,
    "privateMediaManifestIdRequired": true,
    "workerNameMustMatchAcceptedSet": true,
    "imageNameMustMatchAcceptedSet": true,
    "jobTypeMustMatchAcceptedSet": true,
    "claimLeasePlanMustBeAccepted": true
  },
  "duplicatePrevention": {
    "sameJobSameKeyReturnsExistingState": true,
    "sameJobDifferentKeyRequiresOwnerPolicy": true,
    "routeMustNotCreateDuplicateWorkerClaims": true,
    "routeMustNotStartWorkerWithoutLease": true
  },
  "blockedToday": {
    "routeExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "workerLeaseMutationEnabled": false,
    "supabaseMutationEnabled": false
  }
}
```

Future route work must preserve idempotency before touching dispatch, lease, or worker state. This packet does not mutate any state.
