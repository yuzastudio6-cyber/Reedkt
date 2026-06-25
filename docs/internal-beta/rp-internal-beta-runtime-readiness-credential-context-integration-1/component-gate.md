# Component Gate

Internal beta end-to-end status: `not_ready`

Current orchestrator blocker: `blocked_pending_supabase_target_validation_and_runtime_enablement`

Current credential context blocker: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`

The new required gate is `approved_supabase_credential_context_present`. It must be satisfied before any future confirmed Supabase RLS/storage validation or runtime enablement packet may run.

## Required Before Runtime Enablement

- `approved_supabase_credential_context_present`
- `confirmed_supabase_target_rls_storage_validation`
- `guarded_worker_runtime_rpc_staging_sql_execution`
- `service_role_runtime_enablement`
- `approved_snapshot_persistence_runtime`
- `credit_ledger_transaction_runtime`
- `job_queue_lease_event_runtime`
- `private_artifact_manifest_storage_runtime`
- `remotion_private_preview_export_runtime`
- `provider_runtime_owner_approval_if_needed`
- `qa_cleanup_observability_rollback_gates`
- `negative_e2e_runtime_gate_regression`

Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN`

This packet does not unlock that milestone. It only ensures the orchestrator names the credential-context requirement before the confirmed runner is used.
