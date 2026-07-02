# WORKER_RUNTIME_JOBS SOUND CPU Phase 137 Service Role Worker Boundary Plan

```json worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_plan_completed_with_warnings_ready_for_rls_owner_review",
  "serviceRoleBoundary": {
    "serviceRoleAllowedInFrontend": false,
    "serviceRolePayloadFromClientAllowed": false,
    "workerWritesMustUseBackendServiceBoundary": true,
    "workerWritesMustBeAudited": true,
    "approvedSnapshotRequiredForWorkerWrites": true,
    "routeMustNotExposeServiceRole": true
  },
  "futureServiceWriteTargets": [
    "editing_jobs",
    "job_steps",
    "worker_events",
    "qa_reports",
    "media_assets",
    "generated_assets"
  ],
  "blockedToday": {
    "serviceRoleUseEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "routeExecutionEnabled": false
  }
}
```

The service-role boundary is future backend-only and must never be exposed to clients or raw route payloads.
