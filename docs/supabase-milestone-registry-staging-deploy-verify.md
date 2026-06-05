# Supabase Milestone Registry Staging Deploy/Verify

Phase: `supabase-milestone-registry-staging-deploy-verify`

This follow-up prepares a guarded staging-only deployment path for the PR #200 activation milestone registry schema/RLS migration. It deploys only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` when all staging credentials, target proof, Supabase CLI checks, dry-run checks, and current-shell confirmations pass.

The implementation follows the Supabase CLI migration workflow documented for `supabase db push --db-url` and `--dry-run`: https://supabase.com/docs/reference/cli/supabase-db-push

## Allowed

- Detect staging credential presence without printing credential payloads.
- Use `REEDITPRO_SUPABASE_CLI_PATH` when provided and `--version` succeeds.
- Use `supabase` from `PATH` only when `supabase --version` succeeds.
- Create a temporary deploy context containing only the PR #200 registry migration.
- Run `supabase db push --db-url ... --dry-run` before apply.
- Apply only the PR #200 registry schema/RLS migration after the dry-run passes.
- Verify by `supabase migration list --db-url ...` plus committed PR #200 migration/RLS evidence.
- Rerun PR #198 preflight/diff/report only; the Track B backfill write remains blocked in this phase.

## Blocked

- Production Supabase, production SQL, and remote manual SQL.
- Track B backfill writes or milestone data inserts.
- Seed data deployment.
- Ad hoc SQL editor/manual SQL repair.
- Provider calls, route/tool/worker execution, media processing, public output, beta unlock, production unlock, and Track A.
- Auto-installing or downloading the Supabase CLI.

## Current Expected Result

If staging credentials or a compatible Supabase CLI are unavailable, the command writes blocker metadata and stops before staging mutation. The expected blockers in the current local shell are `staging_supabase_credentials_unavailable` and/or `staging_supabase_cli_unavailable`.

## Commands

```bash
npm run activation:supabase-milestone-registry-schema:staging-deploy-report
npm run activation:supabase-milestone-registry-schema:staging-deploy-summary
npm run smoke:activation-supabase-milestone-registry-staging-deploy
```

Guarded deploy, only after credentials, target proof, CLI, dry-run, and confirmations are present:

```bash
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true \
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true \
npm run activation:supabase-milestone-registry-schema:staging-deploy -- --execute --staging --keep-temp
```

Guarded verify, only after deploy:

```bash
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true \
npm run activation:supabase-milestone-registry-schema:staging-verify
```
