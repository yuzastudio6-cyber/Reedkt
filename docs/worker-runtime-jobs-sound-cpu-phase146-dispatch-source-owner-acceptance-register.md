# WORKER_RUNTIME_JOBS SOUND CPU Phase 146 Dispatch Source Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase146-dispatch-source-owner-acceptance-register",
  "acceptedForNextPlanning": [
    "future_source_path_server_workers_sound_cpu_dispatch_contract_ts",
    "allowed_workers_images_job_types",
    "approved_snapshot_idempotency_private_manifest_fields",
    "fail_closed_disabled_dispatch_envelope",
    "owner_review_before_source_creation"
  ],
  "rejectedForCurrentExecution": [
    "dispatch_source_creation",
    "worker_dispatch",
    "claim_lease_mutation",
    "route_execution_enablement",
    "Supabase_job_persistence",
    "media_processing",
    "artifact_storage",
    "real_user_media_beta",
    "paid_production"
  ],
  "acceptedForExecutionToday": false
}
```

The owner acceptance is intentionally limited to the next source-creation plan.
