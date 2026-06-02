# Prompt 20A - Local Supabase Toolchain Repair

## Context

Prompt 20 added local Supabase safety preflight and a guarded local RLS runner, but local SQL/RLS execution remained blocked by missing local config, wrong-architecture Supabase CLI, Docker availability at the time, missing `psql`, no verified local DB URL, and no executable local SQL candidate.

## Allowed Scope

- local Supabase config scaffolding
- preflight and runner hardening
- local-only validation docs
- generated-file ignore rules
- validation results and tracker updates

## Forbidden Scope

No staging/remote/production Supabase execution, SQL execution, migrations, deployment, production/staging secrets, provider calls, tool execution, worker execution, render/export, media processing, storage transfer, signed URL creation, credit mutation, Stripe, dependency mutation, beta unlock, production unlock, or broad service-role handler.

## Deliverables

- `supabase/config.toml`
- hardened `scripts/validation/local-supabase-safety-preflight.mjs`
- hardened `scripts/validation/local-supabase-rls-runner.mjs`
- `docs/local-supabase-toolchain-repair.md`
- `docs/prompt-20a-validation-results.md`
- tracker/source-of-truth updates

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20-local-supabase-rls-validation-execution...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all required diagnostics
- `npm run --silent supabase:rls:prep:diagnostics`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

Do not run SQL unless the target is proven local-only and this prompt explicitly records why. Prompt 20A does not authorize SQL execution.

## Acceptance Criteria

- local Supabase blocker root causes are documented
- safety preflight is hardened
- RLS runner is hardened
- local-only config exists or a precise blocker is documented
- list/dry-run works
- no SQL runs
- no remote/staging/production Supabase is touched
- next prompt recommendation is clear
