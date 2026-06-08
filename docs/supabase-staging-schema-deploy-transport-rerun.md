# Supabase Staging Schema Deploy Transport Rerun

Phase: `supabase-staging-deploy-transport-rerun`

This phase extends the approved target-reference deploy wrapper from PR #216 with a first-class transport strategy:

- approved staging target reference: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- migration: `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql`
- preferred transport: `supabase db push --db-url` with `--dry-run` before apply
- temp CLI transport: gated `npm exec --yes --package supabase@latest -- supabase db push --db-url` with cache/prefix outside the repo
- fallback transport: gated `npx supabase db push --db-url`
- required migration-history audit: `supabase migration list --db-url [REDACTED] --output-format json` before deploy

Current-shell confirmations for deploy:

```bash
REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF=true
REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true
REEDITPRO_CONFIRM_SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT=true
```

Set `REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC=true` only for the temp npm CLI strategy.
Set `REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED=true` only for the npx fallback.

If CLI, temp npm CLI, npx, credentials, target proof, migration-history audit, dry-run, or verification fail, stop with safe blocker metadata. Do not use direct SQL, dashboard SQL editor, manual migration-history repair, `--include-all` apply, or production credentials in this phase.

Current audit result: migration-history listing can pass, but full-repo dry-run may still block when older local migrations are absent remotely. That state must be handled by a separate migration-history repair approval packet; PR #223 must not repair migration history by itself.
