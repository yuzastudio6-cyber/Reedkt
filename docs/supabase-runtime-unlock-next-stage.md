# Supabase Runtime Unlock Next Stage

Next action: repair or provide a compatible migration-safe Supabase CLI/npx transport, then rerun PR #223 after secure SUPABASE_DB_URL process-env injection

The audit recommends continuing PR #223 only after a compatible migration-safe Supabase CLI or gated npx transport is available. The path remains:

1. Securely inject the approved `SUPABASE_DB_URL` payload into process env only.
2. Confirm the DB URL target matches approved staging project `wmyyttnynmteqgcdishd`.
3. Use `supabase db push --db-url` with `--dry-run` before apply.
4. Deploy only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql`.
5. Run schema/RLS verification and PR #198 preflight/diff/report only.

Still blocked: secret_manager_supabase_db_url_candidate_missing_staging_label, secure_secret_manager_env_injection_required, supabase_plugin_staging_target_check_not_confirmed, supabase_plugin_target_not_confirmed_as_staging, staging_supabase_db_url_secret_reference_missing, blocked_credentials_unavailable, blocked_target_not_staging, cli_db_push_unavailable, npx_cli_db_push_unavailable, staging_schema_deploy_not_run, staging_schema_verification_not_run, staging_rls_verification_failed

Track B backfill writes, production Supabase, direct/manual SQL, tools/workers/routes, providers, media processing, Track A, beta, and production remain blocked.
