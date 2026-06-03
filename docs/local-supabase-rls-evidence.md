# Local Supabase/RLS Evidence

Prompt 20 evidence was collected on June 2, 2026 from the local-only safety tooling. It did not run SQL, migrations, storage, providers, render/export, tools, workers, Stripe, telemetry, staging, remote Supabase, or production Supabase.

## Branch And Commit

- Branch: `codex/rp-foundation-20-local-supabase-rls-validation-execution`
- Base: `origin/codex/rp-foundation-19-staging-supabase-rls-validation-preparation`
- Initial implementation commit: `2131703`
- PR: [PR #117](https://github.com/yuzastudio6-cyber/Reedkt/pull/117)
- Final PR head may include the tracker follow-up commit.

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

## Prompt 20A Evidence Update

Prompt 20A records local validation as still blocked, with narrower blockers:

- `supabase/config.toml` was added and is local-only.
- Docker daemon is reachable on this host.
- Supabase CLI remains blocked by architecture mismatch: x86_64 binary on arm64 host, error `-86`.
- `psql` remains missing.
- no local DB URL is verified.
- no executable local SQL candidate exists.

Commands:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Reports config present, Docker usable, CLI/psql/candidate blockers. |
| `npm run supabase:rls:list-tests` | Completed, status `listed`, exit code `0` | Lists all SQL files and executes no SQL. |
| `npm run supabase:rls:local:dry-run` | Completed, status `blocked`, exit code `0` | Confirms SQL run remains refused. |

No local, staging, remote, or production Supabase target was touched.

## Prompt 20D Evidence Update

Prompt 20D verifies manual setup status after Prompt 20C. It does not run SQL, start Supabase, call `supabase status`, reset Supabase, apply migrations, call `psql`, touch staging/remote/production Supabase, or create executable SQL.

Prompt 20D evidence shows:

| Command | Result | Evidence |
| --- | --- | --- |
| `uname -m` | `arm64` | Host architecture recorded. |
| `npm --version` on default PATH | Blocked | Default npm uses a bad-CPU Node shim. |
| `PATH=/Applications/Codex.app/Contents/Resources:$PATH npm --version` | Passed | npm `11.6.2`; validation commands use this path. |
| `file "$(which supabase)"` | Completed | `/usr/local/bin/supabase` is x86_64. |
| `supabase --version` | Blocked | Bad CPU type / error `-86`; no Supabase lifecycle command was run. |
| `docker --version` | Passed | Docker `29.5.2`, build `79eb04c`. |
| `docker info --format '{{.ServerVersion}}'` | Passed | Docker daemon reachable, server version `29.5.2`. |
| `which psql` | Blocked | `psql` missing. |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Reports Docker usable, CLI/psql/local DB URL/candidate blockers. |
| `npm run supabase:rls:list-tests` | Completed, status `listed`, exit code `0` | Lists tests and executes no SQL. |
| `npm run supabase:rls:local:dry-run` | Completed, status `blocked`, exit code `0` | Executes no SQL and reports `callsSupabaseStatus=false`. |

Prompt 20D readiness:

- `canRunLocalSql=false`
- `canProceedToPrompt20B=false`
- `canUseDocker=true`
- `canUsePsql=false`
- `localDbUrlAvailable=false`
- `remoteRiskDetected=false`
- `manualSetupRequired=true`

Remaining blockers after Prompt 20D:

- `/usr/local/bin/supabase` remains x86_64 and fails on arm64 with error `-86`.
- `psql` remains missing.
- no localhost-only local DB URL is verified.
- no executable local SQL candidate exists.

Prompt 20E/manual follow-up is recommended before Prompt 20B.

## Prompt 20E Evidence Update

Prompt 20E adds a manual-only host toolchain probe. It does not install tools, download tools, run `npx`, run SQL, run `supabase start`, call `supabase status`, reset Supabase, apply migrations, connect with `psql`, touch staging/remote/production Supabase, or create executable SQL.

Prompt 20E evidence shows:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run --silent supabase:local:toolchain:probe` | Completed, status `blocked`, exit code `0` | Reports Docker usable, CLI/psql/local DB URL/candidate blockers, and Homebrew `/usr/local` prefix. |
| `npm run --silent supabase:local:preflight` | Expected blocked | Same host blockers as Prompt 20D unless tools are repaired manually. |
| `npm run supabase:rls:list-tests` | Expected listed | No SQL execution. |
| `npm run supabase:rls:local:dry-run` | Expected blocked | No SQL execution and no `supabase status`. |

Prompt 20E readiness:

- `canProceedToPrompt20B=false`
- `canRunLocalSql=false`
- `canUseDocker=true`
- `canUsePsql=false`
- `localDbUrlAvailable=false`
- `remoteRiskDetected=false`
- `manualSetupRequired=true`

Remaining blockers after Prompt 20E:

- `/usr/local/bin/supabase` remains x86_64 and fails on arm64 with error `-86`.
- `psql` remains missing.
- no localhost-only local DB URL is verified.
- no executable local SQL candidate exists.

Prompt 20F/manual host tool repair verification is recommended before Prompt 20B.

## Prompt 20F Evidence Update

Prompt 20F verifies whether manual host repair happened after Prompt 20E. It does not install tools, download tools, run `npx`, run SQL, run `supabase start`, call `supabase status`, reset Supabase, apply migrations, connect with `psql`, touch staging/remote/production Supabase, or create executable SQL.

Prompt 20F evidence shows:

| Command | Result | Evidence |
| --- | --- | --- |
| `uname -m` | `arm64` | Host architecture recorded. |
| `node --version` with Codex PATH | `v24.14.0` | Node path is `/Applications/Codex.app/Contents/Resources/node`. |
| `npm --version` with Codex PATH | `11.6.2` | npm path is `/usr/local/bin/npm`. |
| `brew --prefix` | `/usr/local` | Homebrew remains Intel-prefix on this arm64 host. |
| `file /usr/local/bin/supabase` | Completed | Supabase CLI is x86_64. |
| `supabase --version` | Blocked | Bad CPU type / error `-86`; no Supabase lifecycle/status command was run. |
| `docker --version` | Passed | Docker `29.5.2`, build `79eb04c`. |
| `docker info --format '{{.ServerVersion}}'` | Blocked | Docker daemon unavailable to this process. |
| `which psql` | Blocked | `psql` missing. |
| `npm run --silent supabase:local:toolchain:probe` | Completed, status `blocked`, exit code `0` | Reports CLI/Docker daemon/psql/local DB URL/candidate blockers. |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Reports `nextRecommendedPrompt=Prompt 20F1 - Manual Host Tool Repair Follow-Up`. |
| `npm run supabase:rls:list-tests` | Completed, status `listed`, exit code `0` | Lists tests and executes no SQL; `callsSupabaseStatus=false`. |
| `npm run supabase:rls:local:dry-run` | Completed, status `blocked`, exit code `0` | Executes no SQL and reports `callsSupabaseStatus=false`. |

Prompt 20F readiness:

- `canProceedToPrompt20B=false`
- `canRunLocalSql=false`
- `canUseDocker=false`
- `canUsePsql=false`
- `localDbUrlAvailable=false`
- `remoteRiskDetected=false`
- `manualSetupRequired=true`

Remaining blockers after Prompt 20F:

- `/usr/local/bin/supabase` remains x86_64 and fails on arm64 with error `-86`.
- Docker daemon is unavailable to this process.
- `psql` remains missing.
- no localhost-only local DB URL is verified.
- no executable local SQL candidate exists.

Prompt 20F1/manual host tool repair follow-up is recommended before Prompt 20B.

## Prompt 20G Evidence Update

Prompt 20G fixes the first local migration-chain SQL ambiguity found during local `supabase start`: `ERROR: column reference "description" is ambiguous` in `supabase/migrations/202605130007_generation_providers_generated_assets.sql`.

The repair qualifies seed columns in the `generation_provider_capabilities` and `generation_provider_models` seeded `INSERT ... SELECT` statements. The direct blocker was bare `description` in the model seed insert, where both `public.generation_providers gp` and the lateral `seed` values table expose a `description` column.

Prompt 20G evidence:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run --silent supabase:local:toolchain:probe` | Completed, status `blocked`, exit code `0` | Reports Docker usable, no remote risk, Supabase CLI architecture mismatch, missing `psql`, missing local DB URL, and no executable local SQL candidate. |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Reports `remoteRiskDetected=false`, `canUseDocker=true`, `canStartLocalSupabase=false`, `canRunLocalSql=false`, and `canProceedToPrompt20B=false`. |
| `supabase start` | Not run | Preflight did not allow local start because `/usr/local/bin/supabase` is x86_64 on arm64 and not executable. |
| `supabase status` | Not run | `supabase start` did not run; no localhost DB URL was verified. |

Prompt 20G does not run SQL/RLS smoke tests, staging Supabase, remote Supabase, production Supabase, provider calls, rendering, tool execution, worker execution, credit mutation, Stripe, deployment, or beta unlock.

Prompt 20B remains blocked until local migration-chain validation passes and a first executable local SQL candidate is created. Prompt 20H/local migration-chain follow-up is recommended to retry the local migration chain after the Supabase CLI start gate is repaired.

## Prompt 20C Evidence Update

Prompt 20C adds manual setup docs and clearer blocked-output guidance. It does not run SQL, start Supabase, call `supabase status`, reset Supabase, apply migrations, call `psql`, touch staging/remote/production Supabase, or create executable SQL.

Prompt 20C preflight/list/dry-run evidence should show:

| Command | Expected result | Evidence |
| --- | --- | --- |
| `npm run --silent supabase:local:preflight` | Completed, status `blocked`, exit code `0` | Reports `manualSetupRequired=true`, `nextRecommendedPrompt=Prompt 20D - Manual Environment Setup Verification`, Docker usable, CLI/psql/candidate blockers. |
| `npm run supabase:rls:list-tests` | Completed, status `listed`, exit code `0` | Lists all SQL files and executes no SQL. |
| `npm run supabase:rls:local:dry-run` | Completed, status `blocked`, exit code `0` | Reports manual setup guidance and confirms SQL run remains refused. |

Remaining blockers after Prompt 20C:

- `/usr/local/bin/supabase` remains x86_64 and fails on arm64 with error `-86`.
- `psql` remains missing.
- no verified local DB URL exists.
- no executable local SQL candidate exists.

No local, staging, remote, or production Supabase target was touched.
