# WORKER_RUNTIME_JOBS SOUND CPU Phase158 Source Acceptance Checklist

```json worker-runtime-jobs-sound-cpu-phase158-source-acceptance-checklist
{
  "label": "worker-runtime-jobs-sound-cpu-phase158-source-acceptance-checklist",
  "requiredChecksForActualSourceGate": [
    "future_file_is_server_workers_sound_cpu_disabled_dispatch_route_ts",
    "imports_fail_closed_contract_from_sound_cpu_index",
    "safe_payload_returns_disabled_envelope",
    "invalid_payload_returns_disabled_result",
    "accepted_for_dispatch_always_false",
    "no_worker_execution",
    "no_route_side_effects",
    "no_claim_lease_mutation",
    "no_supabase_mutation",
    "no_sql_execution",
    "no_media_processing",
    "no_artifact_creation"
  ],
  "requiresStaticValidationAfterSourceCreation": true,
  "routeRegistrationDeferred": true,
  "routeExecutionDeferred": true
}
```
