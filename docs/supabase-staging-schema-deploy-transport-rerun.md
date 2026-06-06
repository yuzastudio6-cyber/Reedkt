# Supabase Staging Schema Deploy Transport Rerun

Phase: `supabase-staging-deploy-transport-rerun`

This phase extends the approved target-reference deploy wrapper from PR #216 with a first-class transport strategy:

- approved staging target reference: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- migration: `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql`
- preferred transport: `supabase db push --db-url` with `--dry-run` before apply
- fallback transport: gated `npx supabase db push --db-url`

Current-shell confirmations for deploy:

```bash
REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF=true
REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true
```

Set `REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED=true` only for the npx fallback.

If CLI, npx, credentials, target proof, dry-run, or verification fail, stop with safe blocker metadata. Do not use direct SQL, dashboard SQL editor, manual migration-history repair, or production credentials in this phase.
