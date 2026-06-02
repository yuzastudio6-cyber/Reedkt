# Local Supabase Toolchain Repair

Prompt 20A repairs the repo-owned parts of the local Supabase/RLS validation toolchain after Prompt 20. It does not run SQL, start Supabase, reset a database, touch staging/remote/production Supabase, deploy, or unlock beta.

PR: [PR #119](https://github.com/yuzastudio6-cyber/Reedkt/pull/119)

## Prompt 20 Blockers

Prompt 20 found:

- `supabase/config.toml` was missing.
- `/usr/local/bin/supabase` was x86_64 and failed on this arm64 host with error `-86`.
- Docker daemon was unavailable during the Prompt 20 run.
- `psql` was missing from PATH.
- no verified local Supabase database URL existed.
- no executable local-only SQL candidates existed.

## Prompt 20A Changes

Prompt 20A adds a local-only `supabase/config.toml` scaffold. The file uses local ports, contains no secrets, contains no `[remotes.*]` block, and does not link to staging or production.

Prompt 20A also hardens:

- `scripts/validation/local-supabase-safety-preflight.mjs`
- `scripts/validation/local-supabase-rls-runner.mjs`
- `.gitignore` generated local validation artifacts
- `.github/workflows/foundation-validation.yml` PR trigger coverage for the Prompt 20 base branch

## Supabase CLI Repair Options

Allowed local repair options, outside repo commits:

- install an arm64 Supabase CLI using a trusted package manager path;
- use a pinned Supabase CLI package only if a future prompt explicitly approves that dependency/runtime path;
- use a local Docker Supabase CLI route only if it does not mount secrets and does not target remote Supabase;
- manually place an arm64 Supabase binary outside the repo and make PATH prefer it.

Do not commit downloaded binaries. Do not run `supabase link`. Do not run `supabase db push`, remote migrations, or remote SQL.

## Docker And psql Requirements

Prompt 20A preflight now detects Docker command availability and daemon reachability separately. On this host Docker is reachable, but the Supabase CLI is still architecture-blocked.

`psql` remains required for direct local SQL execution unless a future prompt approves a different local-only SQL executor.

## Safe Commands

Safe evidence commands:

```sh
npm run --silent supabase:local:preflight
npm run supabase:rls:list-tests
npm run supabase:rls:local:dry-run
```

Run mode remains blocked unless all preflight gates pass and the caller explicitly adds `--confirm-local-only`:

```sh
npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/<test>.sql
```

## Forbidden Commands

Do not run:

- `supabase link`
- remote `supabase db push`
- remote `supabase migration up`
- SQL against staging, remote, or production
- provider/tool/worker/render/media/storage/credit/Stripe commands
- deployment commands

## Executable SQL Candidate Status

Prompt 20A does not add `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`.

Reason: local SQL is still not safe because the Supabase CLI cannot execute, `psql` is missing, no verified local database URL exists, and role simulation has not been proven after a local migration reset.

## Remaining Blockers

- Supabase CLI: `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`.
- `psql`: not on PATH.
- Local DB URL: not verified because the CLI cannot run `supabase status --output json`.
- Executable SQL: no local-only candidate exists.

Docker is no longer the current blocker on this host because the daemon is reachable.

## Next Prompt Recommendation

Prompt 20C - Local Supabase Environment Manual Setup.

Prompt 20B should wait until an arm64 Supabase CLI and `psql` are available and preflight reports `canRunLocalSql=true`.

## CI Status

GitHub Foundation Validation passed on PR #119 run `26847503443`.

## Prompt 20C Follow-Up

Prompt 20C adds the manual setup package for the remaining host-level blockers:

- `docs/local-supabase-environment-manual-setup.md`
- `docs/local-supabase-manual-checklist.md`
- `docs/local-supabase-cli-install-options.md`
- `docs/local-postgres-psql-setup.md`

Prompt 20C also improves preflight/runner output with:

- `manualSetupRequired`
- `nextRecommendedPrompt`
- Prompt 20B readiness requirements
- remediation guidance for Supabase CLI, Docker, `psql`, local config, local DB URL, and missing executable SQL candidates

No SQL or Supabase command is run in Prompt 20C. The remaining blocker state is unchanged: wrong-architecture Supabase CLI error `-86`, missing `psql`, no verified local DB URL, and no executable local SQL candidate.

Prompt 20D - Manual Environment Setup Verification is recommended until preflight reports `canRunLocalSql=true`.
