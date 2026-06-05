# Prompt: Supabase Track B Staging Backfill Rerun After Plugin Schema

Use this prompt only after the Supabase plugin staging milestone registry deploy/verify phase has passed.

## Goal

Rerun the PR #198 guarded Track B staging backfill against the verified staging activation milestone registry schema/RLS.

## Required Evidence

- `docs/activation-supabase-plugin-staging-deploy-reports/supabase_plugin_staging_schema_deploy_report.json`
- `docs/activation-supabase-plugin-staging-deploy-reports/supabase_plugin_staging_schema_verify_report.json`
- `docs/activation-supabase-plugin-staging-deploy-reports/supabase_plugin_staging_rls_verify_report.json`
- PR #198 preflight and diff reports after schema deploy.

## Rules

- Staging only.
- Metadata rows only.
- No production Supabase or production SQL.
- No schema mutation.
- No provider calls, route/tool/worker execution, media processing, public output, beta/production unlock, or Track A.
- Use PR #198 confirmations only in the backfill phase.
