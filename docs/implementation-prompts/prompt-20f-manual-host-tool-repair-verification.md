# Prompt 20F - Manual Host Tool Repair Verification

## Summary

Prompt 20F verifies whether manual host repair has happened after Prompt 20E. It is verification-only and must not install tools, download tools, run `npx`, run SQL, run Supabase lifecycle/status commands, connect with `psql`, create records, deploy, mutate dependencies, or unlock beta/production.

## Branching

- Base: `origin/codex/rp-foundation-20e-local-supabase-manual-setup-follow-up`
- Branch: `codex/rp-foundation-20f-manual-host-tool-repair-verification`
- PR base: `codex/rp-foundation-20e-local-supabase-manual-setup-follow-up`
- PR title: `[foundation] Prompt 20F manual host tool repair verification`

## Current Known Facts

- Prompt 20E PR #127 is open and GitHub Foundation Validation passed.
- Host architecture is `arm64`.
- `/usr/local/bin/supabase` is x86_64 and fails with bad CPU / error `-86`.
- Docker CLI exists.
- Docker daemon is unavailable to this process during Prompt 20F verification.
- `psql` is missing.
- No localhost-only local DB URL is verified.
- No executable local SQL candidate exists.

## Allowed Scope

- Safe host toolchain probes.
- Documentation and status updates.
- Script messaging improvements.
- Source-of-truth tracker updates.
- Beta blocker updates.
- Validation evidence updates.

## Forbidden Scope

- Tool installation.
- Downloads.
- `npx`.
- `brew install`.
- SQL execution.
- `psql` database connections.
- `supabase start`.
- `supabase status`.
- `supabase db reset`.
- `supabase migration up`.
- `supabase db push`.
- `supabase link`.
- Local/staging/remote/production record creation.
- Staging/remote/production Supabase execution.
- Provider calls.
- Tool execution.
- Worker execution.
- Render/export execution.
- Media processing.
- Storage transfer.
- Signed URL creation.
- Credit mutation.
- Stripe/payment processing.
- External telemetry.
- Production/beta unlock.
- Schema-changing production migration.
- Dependency mutation.
- Broad service-role handlers.
- Committing binaries, generated DB data, Supabase volumes, local secrets, or dependency artifacts.

## Required Verification Commands

Safe host probes:

```sh
uname -m
which node
node --version
which npm
npm --version
which brew
brew --version
brew --prefix
which supabase
file "$(which supabase)"
supabase --version
which docker
docker --version
docker info --format '{{.ServerVersion}}'
which psql
psql --version
npm run --silent supabase:local:toolchain:probe
npm run --silent supabase:local:preflight
npm run supabase:rls:list-tests
npm run supabase:rls:local:dry-run
```

Repo validation:

```sh
git diff --check
git diff --check origin/codex/rp-foundation-20e-local-supabase-manual-setup-follow-up...HEAD
npm ci
npm run lint
npm run typecheck:server
npm run foundation:validate
npm run build
npm run build:server
npm run foundation:validate:with-build
```

## Acceptance Criteria

- Prompt 20F records exact host probe evidence.
- Prompt 20B readiness is based on `canProceedToPrompt20B=true`.
- `canRunLocalSql=true` remains stricter and requires a local executable SQL candidate.
- No SQL, Supabase lifecycle/status command, database connection, migration, install/download, `npx`, or dependency mutation occurs.
- Trackers and beta blocker docs are updated honestly.
- PR is pushed/opened.
- Exact production capability enabled: `none; local host tool repair verification only`.

## Current Decision

Prompt 20F remains blocked. The next recommended prompt is Prompt 20F1 - Manual Host Tool Repair Follow-Up. Prompt 20B waits until the host toolchain probe or preflight reports `canProceedToPrompt20B=true`.
