# SUPABASE-SOUND-4-BLOCKED Local Throwaway Database Setup Plan

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is setup-plan-only.
- This document does not execute SQL.
- This document does not create or drop databases.
- This document does not start services.
- This document does not install packages.
- This document does not touch Supabase cloud.
- This document does not unlock generated_local_fixture_passed.

## Blocker summary

- SUPABASE-SOUND-4 was blocked because local PostgreSQL was unavailable during that attempt.
- `pg_isready -h localhost` returned no response during the blocked validation result.
- No SQL was executed.
- No local throwaway database was created.
- No local throwaway database was dropped.
- No Supabase cloud target was touched.
- generated_local_fixture_passed remains unclaimed.

## Current local tooling inspection

- `psql` is available through Postgres.app.
- `pg_isready` is available through Postgres.app.
- `createdb` is available through Postgres.app.
- `dropdb` is available through Postgres.app.
- `psql --version` reports PostgreSQL 18.4 from Postgres.app.
- `pg_isready -h localhost` now reports `localhost:5432 - accepting connections`.
- This document still does not connect to a database, execute SQL, create a database, drop a database, or start a service.
- The historical blocker is recorded for traceability, while the current local readiness signal supports a future retry prompt only.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs and public artifacts remain blocked.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Local validation must not create worker or provider execution payloads from raw chat.

## Local validation target requirements

- The target must be local or throwaway non-production only.
- The host must be localhost, 127.0.0.1, ::1, or a Unix socket.
- The database name must include local, test, throwaway, or sound_fixture_validation.
- Production is forbidden.
- Staging is forbidden unless separately approved in a later prompt.
- Live customer data is forbidden.
- Remote Supabase project targets are forbidden.
- Supabase cloud URLs are forbidden.
- Provider calls are forbidden.
- Worker dispatch is forbidden.
- Storage writes are forbidden.
- Signed URLs are forbidden.
- Credit spend and reservation are forbidden.
- Render, mux, and export are forbidden.
- Cleanup must be verified in the later retry prompt if a throwaway database is created there.

## Recommended setup options

These options document acceptable setup paths only. They are not executed by this prompt.

### Option A - Existing local PostgreSQL service

- The user or operator ensures PostgreSQL is installed and running locally.
- The user or operator verifies `pg_isready -h localhost`.
- A later SUPABASE-SOUND-4 retry may create `reeditpro_sound_fixture_validation_throwaway`.

### Option B - Postgres.app

- The user or operator starts Postgres.app manually outside this prompt.
- The user or operator verifies the local host and port.
- No cloud target is used.
- Current inspection indicates this is the likely active local setup path.

### Option C - Homebrew PostgreSQL

- The user or operator installs or starts PostgreSQL manually outside this prompt.
- Codex must not run install or service-start commands in this prompt.

### Option D - Existing approved repo-local test harness

- This option is allowed only if the repo already has a no-cloud, no-production local database harness.
- The harness must still be owner-approved before use.

### Option E - Docker

- Docker is not allowed by default.
- Docker may be considered only in a later prompt if source-of-truth explicitly approves a local, no-cloud, no-production Docker validation harness.

## Future SUPABASE-SOUND-4 retry preflight

A later retry prompt must verify:

- `command -v psql`.
- `command -v pg_isready`.
- `command -v createdb`.
- `command -v dropdb`.
- `pg_isready -h localhost`.
- local target proof.
- no-production proof.
- no-staging proof.
- no-live-data proof.
- Supabase cloud avoided.
- `supabase/migrations` untouched.
- draft SQL/test files unchanged.
- final owner evidence rollup still valid.
- setup plan smoke passing.

## Future allowed commands after setup, only in SUPABASE-SOUND-4 retry

The following are examples only. They are not run now. They require a later SUPABASE-SOUND-4 retry prompt and must be local-only:

```text
createdb reeditpro_sound_fixture_validation_throwaway
psql -h localhost -d reeditpro_sound_fixture_validation_throwaway -f database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql
psql -h localhost -d reeditpro_sound_fixture_validation_throwaway -f database/test-sql/999_supabase_sound_local_fixture_records_tests.sql
dropdb reeditpro_sound_fixture_validation_throwaway
```

## Forbidden setup paths

- Supabase cloud.
- Production database.
- Staging database unless separately approved.
- Remote host.
- Live customer data.
- Docker unless later explicitly approved.
- Installing packages in Codex.
- Starting services in Codex.
- Writing secrets.
- Reading secrets.
- Signed URLs.
- Provider calls.
- Worker dispatch.
- Storage writes.
- Public artifacts.

## Setup evidence required before retry

- Local PostgreSQL responding.
- Local-only host proof.
- Database creation/drop tools available.
- No live data confirmation.
- User/operator confirmation if manual setup was done.
- Draft SQL/test files unchanged.
- Final owner evidence rollup still valid.
- Setup plan smoke passing.

## Recommendation

SUPABASE-SOUND-4-RETRY: run draft migration validation in approved local throwaway database, no deploy
