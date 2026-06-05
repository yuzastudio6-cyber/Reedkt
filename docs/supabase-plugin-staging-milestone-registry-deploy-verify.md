# Supabase Plugin Staging Milestone Registry Deploy/Verify

Phase: `supabase-plugin-staging-milestone-registry-deploy-verify`

This phase adds plugin-assisted staging target checks and deployment reporting for the activation milestone registry migration:

`supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql`

It is staging-schema-only. It does not backfill Track B milestone rows, insert milestone data, deploy seeds, mutate production, call providers, execute routes/workers/tools, process media, unlock beta/production, or touch Track A.

## Default Outcome

The connected Supabase plugin currently exposes an active project named `Reeditpro` with project ref `wmyyttnynmteqgcdishd`, but that metadata does not prove the project is staging. Branch listing also did not provide staging proof. Therefore the safe default outcome is:

`supabase_plugin_target_not_confirmed_as_staging`

No deploy or verify command may proceed until explicit staging target proof is supplied in the current shell.

## Commands

```bash
npm run activation:supabase-plugin-staging-deploy:plan
npm run activation:supabase-plugin-staging-deploy:preflight
npm run activation:supabase-plugin-staging-deploy:report
npm run activation:supabase-plugin-staging-deploy:summary
npm run smoke:activation-supabase-plugin-staging-deploy
```

Guarded deploy, only when staging target proof, credentials, CLI, dry-run, and confirmations pass:

```bash
REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true \
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true \
npm run activation:supabase-plugin-staging-deploy:deploy -- --execute --staging --keep-temp
```

Guarded verify, only after deployment:

```bash
REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true \
npm run activation:supabase-plugin-staging-deploy:verify
```

## Still Blocked

- Production Supabase and production SQL.
- Direct/manual SQL deploy or SQL editor repair.
- Track B backfill writes and milestone-data inserts.
- Provider calls, route/tool/worker execution, media processing, public output, beta unlock, production unlock, and Track A.
