# Supabase Staging Apply Checklist

This checklist is for RP-E2E-READY-01 live staging validation. It is manual-gated. Do not run remote migrations, live writes, provider calls, Stripe, Remotion, Cloud Run deployment, or destructive cleanup from automation unless the explicit steps below are approved.

## Project Check

- Confirm the active Supabase project is `reeditpro` in the Supabase dashboard.
- If using the Supabase CLI, verify the linked project before any apply command:

```bash
supabase projects list
supabase status
```

Do not use the Yuza Studio Supabase project.

## Migration Order

Use `supabase/e2e-runtime-migration-manifest.json` and `supabase/migration-order.md`.

Required staging order:

1. RP-DB migrations from `202605130001` through `202605130008`.
2. Current RP-DATA compatibility migrations from `202605180001` through `202605180008`, if the staging schema uses that chain.
3. `202605190001_sfx_director_tables.sql`
4. `202605190002_storytiming_master_tables.sql`
5. `202605200001_storage_upload_pipeline_readiness.sql`
6. `202605200002_worker_leases_runtime_transport.sql`
7. `202605210001_e2e_runtime_readiness_tables.sql`
8. `202605210002_e2e_service_role_runtime_rpcs.sql`
9. `202605210003_e2e_production_service_path_hardening.sql`

Before applying remotely:

```bash
npm.cmd run smoke:supabase:migration-manifest
```

## Required Local Env

Set these only in your local shell or secure deployment environment:

```powershell
$env:SUPABASE_E2E_SMOKE_MODE="live"
$env:SUPABASE_E2E_ALLOW_WRITES="false"
$env:SUPABASE_E2E_CLEANUP="true"
$env:SUPABASE_URL="<staging supabase url>"
$env:SUPABASE_ANON_KEY="<staging anon key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging service-role key>"
$env:SUPABASE_E2E_USER_ID="<existing safe staging auth user id>"
$env:API_ALLOW_MOCK_WITHOUT_SUPABASE="false"
$env:E2E_RUNTIME_MODE="local"
$env:WORKER_RUNTIME_MODE="local"
$env:STORAGE_MODE="local"
```

Never set a service-role key in a `VITE_*` variable.

## Required GitHub Secrets

For manual workflow validation:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`

The staging smoke user id is provided as a manual workflow input so the UUID is visible and deliberate.

## Readiness Commands

Run read-only checks first:

```powershell
npm.cmd run smoke:supabase:live-env
npm.cmd run smoke:supabase:tables
npm.cmd run smoke:supabase:rpcs
npm.cmd run smoke:supabase:rls-auth
```

Then enable writes only when the table/RPC/RLS checks are acceptable:

```powershell
$env:SUPABASE_E2E_ALLOW_WRITES="true"
npm.cmd run smoke:supabase:write
npm.cmd run smoke:e2e:rpc-persisted-render
npm.cmd run smoke:e2e:supabase-full
```

## Cleanup Rules

Live smoke records must include:

- `e2eSmoke: true`
- `smokeRunId`
- `createdBy: "rp-e2e-smoke"`

Cleanup may delete only records tagged with the same `smokeRunId`. If `SUPABASE_E2E_CLEANUP=false`, records are left for manual inspection.

## Rollback Notes

- Prefer restoring from a staging backup/snapshot over hand-editing production-like tables.
- Do not delete untagged records during smoke cleanup.
- If a migration fails, stop and record the failed migration, Supabase project id, and error output before retrying.

## Must Remain Disabled

- AI provider calls
- Stripe
- Remotion rendering
- Cloud Run deployment
- Production GCS writes
- Provider gateway real calls
