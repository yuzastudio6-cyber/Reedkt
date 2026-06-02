# Prompt 19 - Staging Supabase/RLS Validation Preparation

## Small Context

Prompt 18 created the E2E staging smoke-test plan and beta readiness gates, but all SQL/RLS smoke tests remain draft-only and no local, staging, or remote Supabase validation has been executed. Prompt 19 prepares the validation path so Prompt 20 can safely run local Supabase/RLS validation.

## Branch And PR

- Branch: `codex/rp-foundation-19-staging-supabase-rls-validation-preparation`
- Base: `codex/rp-foundation-18-e2e-staging-smoke-test-plan`
- PR: pending

## Allowed Scope

- Supabase/RLS validation preparation docs.
- Draft SQL/RLS inventory.
- Draft-to-executable conversion plan.
- Local and staging Supabase preflight planning.
- Synthetic fixture strategy.
- Validation manifest.
- Validation evidence checklist.
- Static diagnostics that inspect files only.
- CI/static validation integration.
- Source-of-truth tracker updates.
- Beta readiness blocker updates.

## Forbidden Scope

- Running Supabase CLI.
- Running SQL.
- Running local/staging/remote Supabase.
- Applying migrations.
- Linking remote Supabase.
- Creating staging records.
- Reading or writing secrets.
- Creating signed URLs.
- Storage transfer.
- Provider calls.
- Tool execution.
- Worker execution.
- Render/export execution.
- Media processing.
- Credit mutation.
- Stripe/payment processing.
- External telemetry.
- Production/beta unlock.
- Schema-changing migrations.
- Dependency mutation.
- Broad service-role handlers.

## Deliverables

- `docs/staging-supabase-rls-validation-preparation.md`
- `docs/supabase-rls-test-manifest.md`
- `docs/rls-draft-to-executable-conversion-plan.md`
- `docs/staging-supabase-environment-contract.md`
- `docs/supabase-rls-fixture-contract.md`
- `docs/staging-supabase-validation-runbook.md`
- `docs/supabase-validation-evidence-checklist.md`
- `docs/prompt-19-validation-results.md`
- `docs/implementation-prompts/prompt-19-staging-supabase-rls-validation-preparation.md`
- `database/test-sql/README.md`
- `scripts/validation/supabase-rls-preparation-diagnostics.mjs`
- Package/foundation validation/workflow/tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-18-e2e-staging-smoke-test-plan...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all existing diagnostics through `e2e:staging:diagnostics`
- `npm run --silent supabase:rls:prep:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Supabase/RLS validation preparation document exists.
- RLS test manifest exists.
- Draft-to-executable conversion plan exists.
- Staging environment contract exists.
- Fixture contract exists.
- Validation runbook exists.
- Evidence checklist exists.
- Beta readiness scorecard is updated honestly.
- Production blocker inventory is updated.
- Supabase/RLS preparation diagnostics pass.
- `database/test-sql/README.md` exists.
- No SQL/Supabase execution is enabled.
- Next prompt recommendation is clear.

## Capability Statement

Exact production capability enabled: `none; Supabase/RLS validation preparation only`.
