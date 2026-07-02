# WORKER_RUNTIME_JOBS SOUND CPU Phase 138 Route Contract Owner Register

```json worker-runtime-jobs-sound-cpu-phase138-route-contract-owner-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase138-route-contract-owner-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase138_route_source_owner_review_passed_with_warnings_ready_for_actual_route_source_creation",
  "acceptedFutureHandlers": [
    "createSoundCpuWorkerJobRoute",
    "getSoundCpuWorkerJobStatusRoute"
  ],
  "acceptedRequiredFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "privateMediaManifestId"
  ],
  "acceptedFailClosedResponses": [
    "runtime_disabled",
    "missing_approved_snapshot",
    "missing_private_media_manifest",
    "unsupported_worker",
    "unsupported_image",
    "unsupported_job_type",
    "missing_idempotency_key",
    "storage_rls_not_ready",
    "route_execution_not_enabled"
  ],
  "routeExecutionEnabled": false
}
```

The future route must stay disabled and fail closed until later execution gates.
