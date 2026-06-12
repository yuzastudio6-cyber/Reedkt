# Worker Runtime Next Phase Plan

Next phase: `WORKER_1` - Approved-plan snapshot worker dry-run

Readiness: `ready for approved-plan snapshot dry-run`

Allowed in WORKER-1:

- `load_committed_plan_snapshot_1_candidate_evidence`
- `build_local_nonexecuting_worker_job_payloads`
- `simulate_claim_lease_heartbeat_event_transitions_as_json_only`
- `validate_private_artifact_manifest_scope`
- `record_owner_handoff_review_states`
- `produce_local_and_private_gcs_json_evidence_when_guarded`

Blocked in WORKER-1:

- `real_worker_dispatch`
- `tool_execution`
- `provider_calls`
- `route_execution`
- `runtime_execution`
- `media_processing`
- `browser_map_web_execution`
- `sql_migration_schema_rls_change`
- `supabase_product_row_write`
- `public_artifact_creation`
- `signed_url_source_of_truth`
- `production_or_external_beta_unlock`
- `raw_prompt_execution`

Real runtime execution requires a superseding approval: `true`
