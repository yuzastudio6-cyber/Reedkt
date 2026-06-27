# WORKER_RUNTIME_JOBS SOUND CPU Runner Boundary Reauthorization Scope Register After Image Import Proof

```json worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof",
  "authorizedForFuturePreflightOnly": [
    "approved_snapshot_bound_synthetic_payloads",
    "idempotency_bound_synthetic_payloads",
    "accepted_sound_cpu_tool_id_allowlist",
    "forbidden_payload_stop_conditions",
    "sanitized_evidence_only",
    "fail_closed_runtime_flags"
  ],
  "notAuthorized": [
    "product_tool_call_execution",
    "worker_dispatch",
    "route_execution",
    "media_file_open",
    "media_processing",
    "artifact_write",
    "supabase_mutation",
    "sql_execution",
    "provider_model_call",
    "docker_or_gcp_action",
    "external_beta_unlock",
    "production_unlock",
    "generated_local_fixture_passed_claim",
    "dry_run_passed_claim"
  ],
  "counts": {
    "futurePreflightAuthorizedItemCount": 6,
    "notAuthorizedItemCount": 14,
    "productExecutionAuthorizedCount": 0
  }
}
```
