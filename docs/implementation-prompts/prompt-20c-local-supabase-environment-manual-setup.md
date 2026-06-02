# Prompt 20C - Local Supabase Environment Manual Setup

## Goal

Create the manual setup and verification package needed to repair the local Supabase environment before the first executable local RLS smoke test.

## Context

Prompt 20 added local-only preflight and a guarded RLS runner, but no SQL ran. Prompt 20A added local-only `supabase/config.toml`, hardened the preflight/runner, and proved Docker is reachable. The local environment is still blocked by wrong-architecture Supabase CLI, missing `psql`, no verified local DB URL, and no executable local SQL candidate.

## Allowed Scope

- documentation for local Supabase CLI repair;
- documentation for arm64 CLI selection;
- documentation for `psql` setup;
- documentation for Docker/local daemon requirements;
- documentation for local DB URL verification;
- validation scripts that inspect local tools only;
- preflight messaging improvements;
- runner messaging improvements;
- local setup checklist;
- CI/static validation updates;
- status/source-of-truth/beta blocker updates.

## Forbidden Scope

- staging Supabase execution;
- remote Supabase execution;
- production Supabase execution;
- `supabase link`;
- SQL execution;
- migration execution;
- local DB reset/start in Prompt 20C;
- use of staging/production credentials;
- provider calls;
- tool execution;
- worker execution;
- render/export execution;
- media processing;
- storage transfer;
- signed URL creation;
- credit mutation;
- Stripe/payment processing;
- external telemetry;
- production/beta unlock;
- production schema migrations;
- dependency mutation;
- broad service-role handlers.

## Deliverables

- `docs/local-supabase-environment-manual-setup.md`
- `docs/local-supabase-manual-checklist.md`
- `docs/local-supabase-cli-install-options.md`
- `docs/local-postgres-psql-setup.md`
- `docs/prompt-20c-validation-results.md`
- updated local Supabase safety preflight and runner messaging
- updated production status, source-of-truth map, milestone plan, implementation prompt tracker, evidence docs, scorecard, and blocker inventory

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20a-local-supabase-toolchain-repair...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all existing diagnostics
- `npm run --silent supabase:rls:prep:diagnostics`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Manual setup guide exists.
- Manual checklist exists.
- CLI install options doc exists.
- `psql` setup doc exists.
- Preflight/runner messages are clearer.
- It is clear whether Prompt 20B can run local SQL.
- No SQL or Supabase execution happened.
- No remote/staging/prod target was touched.
- Next prompt recommendation is clear.
