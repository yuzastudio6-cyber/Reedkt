# Supabase Staging Apply Runbook

This runbook is for RP-E2E-READY-01 Prompt 11. It prepares a manual, dry-run-first migration apply path for the `reeditpro` Supabase staging project.

## Safety Rules

- Do not commit secrets.
- Do not put service-role keys in `VITE_*` variables.
- Do not run provider calls, Stripe, Remotion rendering, or Cloud Run deployment.
- Do not enable writes until read-only validation passes.
- Do not delete anything except smoke-tagged records from the same `smokeRunId`.

## Required Local Tools

- Node dependencies installed with `npm.cmd ci`
- Supabase CLI installed and authenticated
- A verified staging project ref for the `reeditpro` project

Verify the human-readable project in the Supabase dashboard before applying. The helper scripts can verify `SUPABASE_PROJECT_REF`, but they cannot prove the dashboard name.

## PowerShell Dry Run

```powershell
$env:SUPABASE_PROJECT_REF="<reeditpro staging project ref>"
npm.cmd run smoke:supabase:migration-manifest
powershell -ExecutionPolicy Bypass -File .\scripts\supabase\apply-e2e-migrations.ps1
```

The dry run prints the manifest order and verifies every migration file exists. It does not connect to Supabase and does not apply SQL.

## Bash Dry Run

```bash
export SUPABASE_PROJECT_REF="<reeditpro staging project ref>"
npm run smoke:supabase:migration-manifest
bash scripts/supabase/apply-e2e-migrations.sh
```

## Apply To Staging

Only run after local review, target project verification, and read-only staging validation planning:

```powershell
$env:SUPABASE_PROJECT_REF="<reeditpro staging project ref>"
powershell -ExecutionPolicy Bypass -File .\scripts\supabase\apply-e2e-migrations.ps1 -Apply
```

The helper links the Supabase CLI to the explicit project ref and runs `supabase db push`. It never reads or prints `SUPABASE_SERVICE_ROLE_KEY`.

## After Apply

Run read-only validation before any write smoke:

```powershell
$env:SUPABASE_E2E_SMOKE_MODE="live"
$env:SUPABASE_E2E_ALLOW_WRITES="false"
$env:SUPABASE_URL="<staging supabase url>"
$env:SUPABASE_ANON_KEY="<staging anon key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging service-role key>"
npm.cmd run smoke:supabase:live-env
npm.cmd run smoke:supabase:live-migration-status
npm.cmd run smoke:supabase:tables
npm.cmd run smoke:supabase:rpcs
npm.cmd run smoke:supabase:rls-auth
```

## Rollback Notes

- Prefer staging backup/snapshot restore over hand deletion.
- Stop immediately on a failed migration and preserve the Supabase CLI output.
- Do not run cleanup scripts against untagged records.
- Production remains blocked until staging validation and explicit approval are complete.
