# Supabase Staging Deploy Transport Rerun

Run id: `supabase-staging-deploy-transport-rerun-20260606`

This phase proves a migration-safe staging deploy transport for `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` and reruns schema/RLS verification only when every target, credential, CLI, dry-run, and confirmation gate passes.

- Readiness: blocked
- Selected strategy: temp_npm_exec_supabase_cli
- Deploy performed: no
- Verification performed: no
- Track B backfill rows written: no
- Production affected: no
- Direct/manual SQL run: no
- Active blockers: staging_schema_dry_run_failed, remote_migration_history_not_in_temp_context, staging_schema_verification_not_run, staging_rls_verification_failed
- Next: Resolve the exact Secret Manager label/operator-injection, CLI, temp npm exec, npx, staging DB URL secret-reference, or migration-safe transport blocker.
