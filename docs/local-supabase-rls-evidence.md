# Local Supabase/RLS Evidence

Prompt 20 evidence was collected on June 2, 2026 from the local-only safety tooling. It did not run SQL, migrations, storage, providers, render/export, tools, workers, Stripe, telemetry, staging, remote Supabase, or production Supabase.

## Branch And Commit

- Branch: `codex/rp-foundation-20-local-supabase-rls-validation-execution`
- Base: `origin/codex/rp-foundation-19-staging-supabase-rls-validation-preparation`
- Head commit: pending until Prompt 20 commit is created.

## Commands Run

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Local blocker summary emitted as JSON. |
| `npm run supabase:rls:list-tests` | Completed, status `listed`, exit code `0` | Listed SQL files; no executable local candidates. |
| `npm run supabase:rls:local:dry-run` | Completed, status `blocked`, exit code `0` | Confirmed SQL execution is refused. |
| `node scripts/validation/local-supabase-safety-preflight.mjs` | Completed, status `blocked`, exit code `0` | Local blocker summary emitted as JSON. |
| `node scripts/validation/local-supabase-rls-runner.mjs --list-tests` | Completed, status `listed`, exit code `0` | Listed SQL files; no executable local candidates. |
| `node scripts/validation/local-supabase-rls-runner.mjs --dry-run` | Completed, status `blocked`, exit code `0` | Confirmed SQL execution is refused. |

## Local Supabase Status

Preflight found:

- Supabase CLI path: `/usr/local/bin/supabase`
- Supabase CLI architecture: `Mach-O 64-bit executable x86_64`
- Host architecture: `arm64`
- Supabase CLI execution error: `Unknown system error -86`
- `supabase/config.toml`: missing
- `.supabase` project-ref indicators: none detected

Because the CLI cannot execute and local config is missing, the runner did not call `supabase status`.

## Docker Status

Preflight found:

- Docker path: `/usr/local/bin/docker`
- Docker architecture: `Mach-O 64-bit executable arm64`
- Docker version: `29.5.2`, build `79eb04c`
- Docker daemon: unavailable to this process

Docker could not be used as a local validation route.

## psql Status

`psql` was not found on PATH.

The runner cannot execute local SQL directly until `psql` or an approved local SQL execution route exists.

## Migration Apply Status

No migration command was run.

Reason: no proven local-only Supabase target.

## RLS Test Status

No RLS SQL test was run.

`database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` remains draft-only because the local environment cannot prove:

- compatible Supabase CLI
- local Supabase config
- local DB URL
- role simulation
- migration reset/application
- fixture cleanup

## Skipped Tests

Files `006` through `020` remain draft-only.

Files `001` through `005` remain legacy manual/review-needed SQL checklists and are not runner-executable in Prompt 20.

## Remote/Staging/Production Confirmation

Prompt 20 did not touch:

- local Supabase SQL
- staging Supabase
- remote Supabase
- production Supabase
- Supabase link
- Supabase remote migration
- production migration
- staging records
- production records

## Blockers

1. `supabase/config.toml` missing.
2. Supabase CLI architecture mismatch and error `-86`.
3. Docker daemon unavailable.
4. `psql` missing.
5. No verified local Supabase database URL.
6. No local executable SQL candidates.

## Evidence Decision

Prompt 20 records local validation as `validation_blocked`. Prompt 20A should repair the local Supabase toolchain before SQL/RLS execution is attempted again.
