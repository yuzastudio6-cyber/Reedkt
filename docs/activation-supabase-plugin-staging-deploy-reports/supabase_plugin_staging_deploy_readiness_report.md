# Supabase Plugin Staging Deploy Readiness

Status: `blocked`

This report is safe metadata only. It does not include DB URLs, tokens, service-role keys, anon keys, signed URLs, private payloads, or raw Supabase output.

Active blockers: `supabase_plugin_staging_target_check_not_confirmed`, `supabase_plugin_target_not_confirmed_as_staging`, `plugin_schema_state_not_inspected`, `plugin_rls_state_not_inspected`, `blocked_target_not_staging`, `blocked_credentials_unavailable`, `cli_db_push_unavailable`, `staging_schema_deploy_not_confirmed`, `staging_schema_deploy_not_run`, `staging_schema_verify_not_confirmed`, `staging_schema_verification_not_run`

Next: Resolve the exact staging target/credential/CLI/plugin migration-safe path blocker before rerunning deploy/verify.
