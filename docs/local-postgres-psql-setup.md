# Local Postgres psql Setup

Prompt 20C does not install or run `psql`. This document records safe manual setup options for the local SQL executor needed by the guarded RLS runner.

## Why psql Is Needed

`scripts/validation/local-supabase-rls-runner.mjs` is designed to run selected SQL files only after preflight proves a local-only target. It uses `psql` so SQL execution can be explicit, redacted, and limited to `database/test-sql/local/`.

No SQL may run in Prompt 20C.

## Current Blocker

`psql` is not on PATH.

Until `psql` or a future approved local-only SQL executor exists, run mode must remain blocked.

## Manual Install Options

Allowed manual options outside repo commits:

- Postgres.app command-line tools.
- Homebrew `postgresql`.
- Homebrew `libpq` with PATH configured outside the repo.
- A future reviewed Docker `psql` route that connects only to the local Supabase database URL.

## Verify psql

Use:

```sh
which psql
file "$(which psql)"
psql --version
```

On Apple Silicon, confirm the binary is compatible with the host architecture.

## No Remote DB Rule

Never connect `psql` to:

- staging Supabase;
- remote Supabase;
- production Supabase;
- a database containing production data;
- a database containing private media, provider payloads, service-role keys, signed URLs, Stripe data, or raw user PII.

## Runner Usage Later

The future local SQL command shape remains:

```sh
npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/<test-file>.sql
```

That command must still refuse execution unless preflight reports `canRunLocalSql=true`.
