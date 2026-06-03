# Prompt 20E - Local Supabase Manual Setup Follow-Up

## Summary

Prompt 20E verifies host local Supabase toolchain readiness after Prompt 20D. It is manual-only and does not install tools or run SQL.

## Branch

- Branch: `codex/rp-foundation-20e-local-supabase-manual-setup-follow-up`
- Base: `origin/codex/rp-foundation-20d-manual-environment-setup-verification`
- PR title: `[foundation] Prompt 20E local Supabase manual setup follow-up`

## Allowed Scope

- host toolchain probes for Node, npm, Supabase CLI, Docker, Homebrew, and `psql`;
- local-only config and env-name safety checks;
- preflight/list/dry-run verification;
- docs/status/evidence updates;
- non-mutating script messaging improvements.

## Forbidden Scope

- no tool installation or downloads;
- no `npx` command execution;
- no SQL;
- no `supabase start`, `supabase status`, `supabase db reset`, migration, push, or link commands;
- no `psql` database connection;
- no local/staging/remote/production Supabase record creation;
- no provider, tool, worker, render/export, media, storage, credit, Stripe, telemetry, deploy, dependency mutation, or beta unlock.

## Deliverables

- `docs/local-supabase-manual-setup-follow-up.md`
- `docs/prompt-20e-validation-results.md`
- `scripts/validation/local-supabase-host-toolchain-probe.mjs`
- package script `supabase:local:toolchain:probe`
- tracker and source-of-truth updates

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20d-manual-environment-setup-verification...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all existing diagnostics through `npm run --silent supabase:rls:prep:diagnostics`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- host toolchain state is documented;
- probe is local-only and non-mutating;
- Prompt 20B readiness is explicit;
- no SQL or Supabase lifecycle/status command runs;
- no host tools are installed or downloaded;
- next prompt recommendation is clear.
