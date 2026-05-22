# Supabase Staging Write Validation

This runbook is for explicit live write validation after read-only staging checks pass. Writes remain disabled by default.

## Preconditions

- The active staging project is verified as `reeditpro`.
- Read-only validation passed.
- Prompt 7-10 migrations and RPCs are applied.
- A safe staging auth user exists for `SUPABASE_E2E_USER_ID`.
- FFmpeg/FFprobe are available for persisted render validation, either locally or through GitHub Actions.

## Manual Workflow

Run `.github/workflows/staging-supabase-write-validation.yml`.

Required safety input:

- `allow_writes=true`

Optional actions:

- `run_write_smoke=true`
- `run_persisted_render=true`
- `cleanup=true`
- `smoke_user_id=<existing safe staging auth user id>`

If `allow_writes` is false, the workflow exits with instructions and performs no validation writes.

## Local PowerShell Write Smoke

```powershell
$env:SUPABASE_E2E_SMOKE_MODE="live"
$env:SUPABASE_E2E_ALLOW_WRITES="true"
$env:SUPABASE_E2E_CLEANUP="true"
$env:SUPABASE_URL="<staging supabase url>"
$env:SUPABASE_ANON_KEY="<staging anon key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging service-role key>"
$env:SUPABASE_E2E_USER_ID="<existing safe staging auth user id>"
$env:API_ALLOW_MOCK_WITHOUT_SUPABASE="false"
$env:E2E_RUNTIME_MODE="local"
$env:WORKER_RUNTIME_MODE="local"
$env:STORAGE_MODE="local"

npm.cmd run smoke:supabase:live-env
npm.cmd run smoke:supabase:live-migration-status
npm.cmd run smoke:supabase:write
```

## Local Persisted Render Smoke

Run only after the write/read smoke passes:

```powershell
npm.cmd run smoke:e2e:rpc-persisted-render
npm.cmd run smoke:e2e:supabase-full
```

## Cleanup Constraints

Live write records must include:

- `metadata_json.e2eSmoke=true`
- `metadata_json.smokeRunId`
- `metadata_json.createdBy="rp-e2e-smoke"`

Cleanup is constrained to the same smoke run id. Untagged records must never be deleted by smoke cleanup. If `SUPABASE_E2E_CLEANUP=false`, records remain for manual inspection.

## Failure Handling

- Missing table/RPC: stop, apply missing migrations in order, then re-run read-only validation.
- Missing user id: set `SUPABASE_E2E_USER_ID` to an existing safe staging auth user.
- Failed write smoke: preserve output and smoke run id; do not retry with cleanup disabled unless intentionally inspecting records.
- Failed persisted render: preserve output and local tool versions; provider calls, Stripe, Remotion, and Cloud Run remain out of scope.
