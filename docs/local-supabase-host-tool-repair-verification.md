# Local Supabase Host Tool Repair Verification

Prompt 20F verifies whether the host tools required for the first local-only Supabase/RLS smoke test have been repaired after Prompt 20E. It is verification-only and does not install tools, download tools, run `npx`, execute SQL, run Supabase lifecycle or status commands, connect with `psql`, create records, deploy, mutate dependencies, or unlock beta/production.

## Purpose

Prompt 20F checks the local host state before Prompt 20B. Prompt 20B may proceed only when the non-SQL environment gates report `canProceedToPrompt20B=true`. `canRunLocalSql=true` remains stricter because it also requires a local executable SQL candidate under `database/test-sql/local/`.

## Branch

- Branch: `codex/rp-foundation-20f-manual-host-tool-repair-verification`
- Base: `origin/codex/rp-foundation-20e-local-supabase-manual-setup-follow-up`
- PR base: `codex/rp-foundation-20e-local-supabase-manual-setup-follow-up`
- Exact production capability enabled: `none; local host tool repair verification only`

## Prompt 20E CI Baseline

Prompt 20E PR #127 is open and GitHub Foundation Validation passed:

- PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/127
- Head: `0fbd56c0822af132d7f1d899a4d78e5508efb672`
- Foundation Validation job: https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/26860926832/job/79214087011

## Safe Host Probe Evidence

All commands used the Codex-bundled Node/npm path for npm commands:

```sh
env PATH=/Applications/Codex.app/Contents/Resources:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin <command>
```

Host probe result:

| Check | Result |
| --- | --- |
| Host architecture | `arm64` |
| Node path | `/Applications/Codex.app/Contents/Resources/node` |
| Node version | `v24.14.0` |
| npm path | `/usr/local/bin/npm` |
| npm version | `11.6.2` |
| Homebrew path | `/usr/local/bin/brew` |
| Homebrew version | `Homebrew 5.1.14` |
| Homebrew prefix | `/usr/local` |
| Supabase CLI path | `/usr/local/bin/supabase` |
| Supabase CLI architecture | `Mach-O 64-bit executable x86_64` |
| Supabase CLI version attempt | blocked with `Bad CPU type in executable` / error `-86` |
| Docker path | `/usr/local/bin/docker` |
| Docker CLI version | `Docker version 29.5.2, build 79eb04c` |
| Docker daemon | unavailable to this process |
| `psql` path | missing |
| `psql --version` | blocked: `No such file or directory` |

## Structured Probe Decision

`npm run --silent supabase:local:toolchain:probe` completed with exit code `0` and reported:

- `status=blocked`
- `canProceedToPrompt20B=false`
- `canRunLocalSql=false`
- `canUseDocker=false`
- `canUsePsql=false`
- `localDbUrlAvailable=false`
- `remoteRiskDetected=false`
- `manualSetupRequired=true`
- `nextRecommendedPrompt=Prompt 20F1 - Manual Host Tool Repair Follow-Up`

Blocker IDs:

- `supabase_cli_arch_mismatch`
- `docker_daemon_unavailable`
- `psql_missing`
- `local_db_url_missing`
- `local_sql_candidate_missing`

## Preflight And Runner Decision

`npm run --silent supabase:local:preflight` completed with exit code `0` and reported the same blocked decision:

- `status=blocked`
- `canProceedToPrompt20B=false`
- `canRunLocalSql=false`
- `canStartLocalSupabase=false`
- `canResetLocalSupabase=false`
- `canUseDocker=false`
- `canUsePsql=false`
- `localDbUrlAvailable=false`
- `remoteRiskDetected=false`

`npm run supabase:rls:list-tests` completed with exit code `0`:

- mode: `list-tests`
- SQL executed: false
- `callsSupabaseStatus=false`
- selected executable tests: none

`npm run supabase:rls:local:dry-run` completed with exit code `0`:

- mode: `dry-run`
- status: `blocked`
- SQL executed: false
- `callsSupabaseStatus=false`
- selected executable tests: none

## What Changed In Prompt 20F

- Added this verification record.
- Added `docs/prompt-20f-validation-results.md`.
- Added `docs/implementation-prompts/prompt-20f-manual-host-tool-repair-verification.md`.
- Updated trackers and local Supabase evidence docs to record the blocked host state.
- Updated the local preflight and host probe next-prompt wording from Prompt 20F to Prompt 20F1 when blockers remain.
- Added the Prompt 20E branch to the Foundation Validation pull request trigger list.

No runtime route, API capability, SQL file, migration, dependency, local executable SQL candidate, or Supabase execution path was added.

## Manual Repair Path

Prompt 20B remains blocked until these non-SQL gates pass:

1. Replace or shadow `/usr/local/bin/supabase` with an arm64-compatible Supabase CLI outside the repo.
2. Make a local Docker daemon reachable to this process.
3. Install `psql` or provide an approved local SQL executor outside the repo.
4. Provide a localhost-only local Supabase DB URL through an approved local DB URL environment variable.
5. Keep `supabase/config.toml` local-only and do not run `supabase link`.

After those pass, Prompt 20B may create the first executable local-only SQL candidate and run it only through the guarded local runner if that prompt explicitly approves SQL execution.

## Not Run

Prompt 20F did not run:

- SQL
- `psql` database connections
- `supabase start`
- `supabase status`
- `supabase db reset`
- `supabase migration up`
- `supabase db push`
- `supabase link`
- staging Supabase
- remote Supabase
- production Supabase
- tool installation or downloads
- `npx`
- providers, workers, tools, render/export, media processing, storage transfer, signed URLs, credit mutation, Stripe, telemetry, deployment, dependency mutation, or beta/production unlocks

## Decision

Prompt 20F remains `validation_blocked`. Manual host repair has not been proven. The next recommended prompt is Prompt 20F1 - Manual Host Tool Repair Follow-Up.
