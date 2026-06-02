# Prompt 20 - Local Supabase/RLS Validation Execution

## Small Context

Prompt 19 prepared the Supabase/RLS validation plan, manifest, fixture contract, staging environment contract, runbook, evidence checklist, and diagnostics. Prompt 20 attempts the first local-only Supabase/RLS validation path, but only after proving the target is local and isolated.

## Allowed Scope

- Local-only Supabase CLI/Docker readiness checks.
- Local-only Supabase safety preflight scripts.
- Local-only RLS smoke test runner scripts.
- Local-only SQL evidence collection.
- Conversion of safe draft SQL tests to executable local-only tests only if local target, fixtures, cleanup, and role simulation are safe.
- Docs, validation results, beta readiness score, blocker inventory, and implementation tracker updates.

## Forbidden Scope

- Staging Supabase execution.
- Remote Supabase execution.
- Production Supabase execution.
- `supabase link`.
- Remote migrations, remote SQL, production SQL, or staging SQL.
- Production/staging credentials.
- Provider calls.
- Rendering/export.
- Tool execution.
- Worker execution.
- Media processing.
- Storage transfer.
- Signed URL creation.
- Credit mutation.
- Stripe/payment processing.
- External telemetry.
- Deployment.
- Production or beta unlock.
- Schema-changing production migrations.
- Dependency mutation.
- Broad service-role handlers.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- Prompt 19 Supabase/RLS preparation docs.
- Prompt 18 E2E staging and beta readiness docs.
- `database/test-sql/README.md`
- `database/test-sql/*.draft.sql`
- `database/test-sql/*.sql`
- `supabase/README.md`
- `supabase/migration-order.md`
- `supabase/migrations/`
- `scripts/validation/supabase-rls-preparation-diagnostics.mjs`
- `scripts/validation/supabase-schema-static-audit.mjs`
- `scripts/validation/run-foundation-validation.mjs`
- `package.json`
- `package-lock.json`
- `.github/workflows/foundation-validation.yml`

## Deliverables

- `docs/local-supabase-rls-validation-execution.md`
- `docs/local-supabase-safety-preflight.md`
- `docs/local-supabase-rls-evidence.md`
- `docs/prompt-20-validation-results.md`
- `database/test-sql/local/README.md`
- `scripts/validation/local-supabase-safety-preflight.mjs`
- `scripts/validation/local-supabase-rls-runner.mjs`
- Package scripts for local preflight and guarded local RLS runner.
- Prompt 20 tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-19-staging-supabase-rls-validation-preparation...HEAD`
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

Run `npm run supabase:rls:local:run` only if the preflight proves the local target is isolated, configured, executable, and has local executable SQL candidates.

## GitHub Requirement

- Branch: `codex/rp-foundation-20-local-supabase-rls-validation-execution`
- PR base: `codex/rp-foundation-19-staging-supabase-rls-validation-preparation`
- PR title: `[foundation] Prompt 20 local Supabase RLS validation execution`
- PR: [PR #117](https://github.com/yuzastudio6-cyber/Reedkt/pull/117)
- Do not merge the PR.

## Acceptance Criteria

- Local Supabase safety preflight exists and passes or reports exact blockers.
- Local RLS runner exists in safe list/dry-run mode.
- SQL manifest is updated.
- Executable local-only SQL exists only if safe; otherwise blockers are documented.
- Local SQL either runs safely or remains blocked with exact evidence.
- No remote/staging/production Supabase is touched.
- Beta readiness score is updated honestly.
- Next prompt recommendation is clear.

## Prompt 20 Result

Prompt 20 added local-only safety and runner tooling, but local RLS execution remained blocked by missing local config, wrong-architecture Supabase CLI, unavailable Docker daemon, missing `psql`, no verified local DB URL, and no executable local SQL candidates.

Recommended next prompt: Prompt 20A - Local Supabase Toolchain Repair.
