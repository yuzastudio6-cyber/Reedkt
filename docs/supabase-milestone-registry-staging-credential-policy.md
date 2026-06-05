# Supabase Milestone Registry Staging Credential Policy

This phase uses staging credentials by presence only until a guarded CLI command needs the `--db-url` value. Credential values are never committed, printed, summarized, or written into reports.

## Required For Deploy

- `REEDITPRO_STAGING_SUPABASE_DB_URL`
- `REEDITPRO_SUPABASE_TARGET_ENV=staging` or `REEDITPRO_STAGING_SUPABASE_TARGET_CONFIRMED=true`
- `REEDITPRO_STAGING_SUPABASE_TARGET_REFERENCE` as a redacted operator reference
- `REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true`
- `REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true`

## Required For Verify

- `REEDITPRO_STAGING_SUPABASE_DB_URL`
- staging target confirmation
- `REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true`

## Supabase CLI

The runner first checks `REEDITPRO_SUPABASE_CLI_PATH` if provided. Otherwise it checks `supabase` from `PATH`. The phase does not install, download, or run `npx` for Supabase CLI.

## Redaction Rules

Reports may record booleans such as `dbUrlProvided` and `targetConfirmed`. Reports must not include DB URLs, access tokens, service-role keys, anon keys, JWT secrets, provider keys, signed URLs, raw CLI output containing secrets, or environment dumps.

If any forbidden confirmation is set for production, Track B backfill writes, provider calls, route/tool/worker execution, public output, broad media, arbitrary media, or Track A, the deploy/verify path blocks before staging mutation.
