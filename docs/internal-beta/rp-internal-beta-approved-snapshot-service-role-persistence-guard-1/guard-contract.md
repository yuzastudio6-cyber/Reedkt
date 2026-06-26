# Approved Snapshot Service-Role Persistence Guard Contract

Decision: `completed_approved_snapshot_service_role_persistence_guard_no_supabase_write`

Execution: `completed_backend_guard_no_route_or_remote_execution`

Guard statuses:

- `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`
- `blocked_missing_approved_supabase_access_token_alias`
- `blocked_missing_approved_supabase_readonly_db_url_alias`
- `blocked_pending_confirmed_supabase_target_rls_storage_validation`
- `blocked_pending_service_role_persistence_runtime_approval`
- `ready_for_separate_service_role_persistence_implementation_no_supabase_write`

The only ready state is a handoff to a separate implementation. It is not a Supabase write and not a route execution.

Required before persistence:

- `approved_supabase_credential_context_present`
- `confirmed_supabase_target_rls_storage_validation`
- `service_role_persistence_runtime_approval`
- `separate_service_role_persistence_implementation`
- `least_privilege_rls_storage_regression`
- `negative_no_raw_chat_or_prompt_execution_regression`
