# Local Live Supabase Test Runbook

Use this runbook from Windows PowerShell when you are ready to test against a safe Supabase staging project. Values below are placeholders; do not commit them.

## Configure Current Shell

```powershell
$env:API_ALLOW_MOCK_WITHOUT_SUPABASE="false"
$env:E2E_RUNTIME_MODE="local"
$env:WORKER_RUNTIME_MODE="local"
$env:STORAGE_MODE="local"
$env:SUPABASE_E2E_SMOKE_MODE="live"
$env:SUPABASE_E2E_ALLOW_WRITES="false"
$env:SUPABASE_E2E_CLEANUP="true"
$env:SUPABASE_URL="<staging supabase url>"
$env:SUPABASE_ANON_KEY="<staging anon key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging service-role key>"
$env:SUPABASE_E2E_USER_ID="<existing safe staging auth user id>"
```

Never use `VITE_SUPABASE_SERVICE_ROLE_KEY`.

## Read-Only Validation

```powershell
npm.cmd run smoke:supabase:migration-manifest
npm.cmd run smoke:supabase:live-env
npm.cmd run smoke:supabase:tables
npm.cmd run smoke:supabase:rpcs
npm.cmd run smoke:supabase:rls-auth
```

If any read-only check fails, do not enable writes.

## Write Smoke

Only after migrations are applied and read-only checks pass:

```powershell
$env:SUPABASE_E2E_ALLOW_WRITES="true"
npm.cmd run smoke:supabase:write
```

The smoke writes only tagged E2E records and cleanup deletes only records from the same `smokeRunId`.

## Persisted Render Smoke

Requires FFmpeg and FFprobe on PATH:

```powershell
ffmpeg -version
ffprobe -version
npm.cmd run smoke:e2e:rpc-persisted-render
npm.cmd run smoke:e2e:supabase-full
```

Expected success status is `preview_ready`. If live env, tables, RPCs, RLS, tools, or write permission are missing, the commands must fail or skip clearly.

## Cleanup Notes

- Keep `SUPABASE_E2E_CLEANUP=true` for normal smoke runs.
- Use `SUPABASE_E2E_CLEANUP=false` only when you intentionally want to inspect smoke records.
- Never delete records that are not tagged with `e2eSmoke=true`, the same `smokeRunId`, and `createdBy="rp-e2e-smoke"`.
