# WORKER_RUNTIME_JOBS SOUND CPU Phase 138 Route Handler Contract Plan

```json worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase138-route-handler-contract-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase138_route_source_creation_plan_completed_with_warnings_ready_for_route_source_owner_review",
  "futureHandlers": [
    {
      "name": "createSoundCpuWorkerJobRoute",
      "method": "POST",
      "status": "planned_only",
      "executionEnabled": false
    },
    {
      "name": "getSoundCpuWorkerJobStatusRoute",
      "method": "GET",
      "status": "planned_only",
      "executionEnabled": false
    }
  ],
  "requiredRequestFields": [
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
  "requiredFailClosedResponses": [
    "runtime_disabled",
    "missing_approved_snapshot",
    "missing_private_media_manifest",
    "unsupported_worker",
    "unsupported_image",
    "unsupported_job_type",
    "missing_idempotency_key",
    "storage_rls_not_ready",
    "route_execution_not_enabled"
  ]
}
```

Future route handlers must validate all fields and fail closed. This packet does not add handler code.
