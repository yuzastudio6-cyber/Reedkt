# Supabase Staging Deploy Transport Rerun

Run id: `supabase-staging-deploy-transport-rerun-20260606`

This phase proves a migration-safe staging deploy transport for `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` and reruns schema/RLS verification only when every target, credential, CLI, dry-run, and confirmation gate passes.

- Readiness: blocked
- Selected strategy: blocked_no_migration_safe_deploy_path
- Deploy performed: no
- Verification performed: no
- Track B backfill rows written: no
- Production affected: no
- Direct/manual SQL run: no
- Active blockers: secret_manager_supabase_db_url_candidate_missing_staging_label, secure_secret_manager_env_injection_required, cli_db_push_unavailable, npx_cli_db_push_unavailable, blocked_no_migration_safe_deploy_path, staging_schema_deploy_not_run, staging_schema_verification_not_run, staging_rls_verification_failed
- Next: Resolve the exact Secret Manager label/operator-injection, CLI, npx, staging DB URL secret-reference, or migration-safe transport blocker.
