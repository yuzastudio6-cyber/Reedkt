# Supabase Staging Read-Only Validation

This runbook validates the `reeditpro` staging schema without writes, cleanup, provider calls, Stripe, Remotion, or Cloud Run deployment.

## GitHub Secrets

Configure these repository secrets before running the workflow:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`

Do not configure any service-role key as a `VITE_*` secret or variable.

## Manual Workflow

Run `.github/workflows/staging-supabase-readonly-validation.yml` with the default inputs:

- `run_table_check=true`
- `run_rpc_check=true`
- `run_rls_audit=true`

The workflow runs:

```text
npm ci
npm run build:api
npm run typecheck:api
npm run smoke:supabase:live-env
npm run smoke:supabase:live-migration-status
npm run smoke:supabase:tables
npm run smoke:supabase:rpcs
npm run smoke:supabase:rls-auth
```

It does not run write smoke, persisted render, FFmpeg install, or cleanup.

## Local PowerShell Equivalent

```powershell
$env:SUPABASE_E2E_SMOKE_MODE="live"
$env:SUPABASE_E2E_ALLOW_WRITES="false"
$env:SUPABASE_E2E_CLEANUP="true"
$env:SUPABASE_URL="<staging supabase url>"
$env:SUPABASE_ANON_KEY="<staging anon key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging service-role key>"
$env:API_ALLOW_MOCK_WITHOUT_SUPABASE="false"
$env:E2E_RUNTIME_MODE="local"
$env:WORKER_RUNTIME_MODE="local"
$env:STORAGE_MODE="local"

npm.cmd run smoke:supabase:live-env
npm.cmd run smoke:supabase:live-migration-status
npm.cmd run smoke:supabase:tables
npm.cmd run smoke:supabase:rpcs
npm.cmd run smoke:supabase:rls-auth
```

## Interpreting Missing Tables Or RPCs

`smoke:supabase:live-migration-status` maps missing tables and RPCs back to likely manifest entries. If it reports a missing migration:

1. Confirm the active Supabase project is `reeditpro`.
2. Confirm migrations were applied in manifest order.
3. Re-run the read-only workflow.
4. Do not enable writes until the missing table/RPC report is resolved or explicitly accepted as a documented staging exception.

## Read-Only Pass Criteria

- live env check passes without exposing secrets
- migration status has no missing required E2E tables/RPCs
- table readiness is acceptable
- RPC readiness is acceptable
- RLS/auth audit has no blocking findings
