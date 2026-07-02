# WORKER_RUNTIME_JOBS SOUND CPU Phase 136 Route Rejection Stop Rules

```json worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules
{
  "label": "worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules",
  "decision": "worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_plan_completed_with_warnings_ready_for_route_boundary_owner_review",
  "futureHardRejectConditions": [
    "missing_approved_plan_snapshot",
    "missing_workspace_or_project_context",
    "missing_private_media_manifest",
    "raw_prompt_payload",
    "client_supplied_service_role_payload",
    "signed_url_as_source_of_truth",
    "public_artifact_target",
    "unsupported_worker_name",
    "unsupported_image_name",
    "unsupported_job_type",
    "missing_idempotency_key",
    "duplicate_claim_without_owner_policy",
    "route_execution_without_claim_lease_owner_review",
    "supabase_private_storage_rls_not_reviewed"
  ],
  "stopRules": {
    "stopBeforeWorkerDispatch": true,
    "stopBeforeRouteExecution": true,
    "stopBeforeSupabaseMutation": true,
    "stopBeforeArtifactCreation": true,
    "stopBeforeRealUserMediaBeta": true,
    "stopBeforePaidProduction": true
  },
  "blockedToday": {
    "routeExecutionEnabled": false,
    "workerDispatchExecutionEnabled": false,
    "supabaseMutationEnabled": false,
    "artifactCreationEnabled": false,
    "realUserMediaBetaEnabled": false
  }
}
```

These stop rules define the critical “fix or stop” behavior before future route source work can move toward controlled execution.
