# Prompt 18 - E2E Staging Smoke Test Plan

## Small Context

Prompts 0-17 created the production source-of-truth, route/service foundations, fail-closed runtime boundaries, diagnostics, and CI validation path. Prompt 18 connects those foundations into an end-to-end staging smoke-test plan and beta readiness gate without running staging or enabling production capability.

## Allowed Scope

- E2E staging smoke-test plan.
- Beta readiness gates.
- Staging runbook.
- Mock/static smoke flow.
- Future local Supabase, future staging, and future production beta paths as docs only.
- Synthetic fixture contract.
- No-secrets, RLS, storage, route, CI, and blocker checklists.
- Static diagnostics that inspect local files only.
- Draft SQL/RLS planning docs.
- Status and source-of-truth tracking.

## Forbidden Scope

- Real staging deployment or production deployment.
- Local, staging, or remote Supabase execution.
- SQL execution.
- Storage transfer, signed URL creation, real upload/download.
- Real media processing.
- Real worker execution, production job claim, Cloud Run/Pub/Sub/Cloud Tasks execution.
- Provider calls, Secret Manager access, provider secret reads, webhook processing.
- Render/export execution.
- Tool execution or package installation beyond `npm ci`.
- Credit mutation, Stripe/payment processing, external telemetry, production/beta unlock, schema-changing migration, or broad service-role handler.

## Deliverables

- `docs/e2e-staging-smoke-test-plan.md`
- `docs/beta-readiness-gate-contract.md`
- `docs/e2e-smoke-scenario-matrix.md`
- `docs/staging-smoke-fixture-contract.md`
- `docs/staging-smoke-runbook.md`
- `docs/beta-readiness-scorecard.md`
- `docs/production-beta-blocker-inventory.md`
- `docs/e2e-staging-smoke-validation-results.md`
- `database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql`
- `scripts/validation/e2e-staging-smoke-plan-diagnostics.mjs`
- Package script `e2e:staging:diagnostics`
- Foundation validation runner coverage.
- Foundation Validation workflow trigger for the Prompt 17 base.
- Source-of-truth and implementation prompt tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-17-observability-audit-abuse-cost-controls...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run --silent storage:scope:diagnostics`
- `npm run --silent snapshot:scope:diagnostics`
- `npm run --silent credit:scope:diagnostics`
- `npm run --silent backend:api:diagnostics`
- `npm run --silent job:worker:diagnostics`
- `npm run --silent media:readiness:diagnostics`
- `npm run --silent render:export:diagnostics`
- `npm run --silent qa:revision:diagnostics`
- `npm run --silent tool:call:diagnostics`
- `npm run --silent tool:readiness:diagnostics`
- `npm run --silent worker:execution:diagnostics`
- `npm run --silent provider:gateway:diagnostics`
- `npm run --silent compliance:diagnostics`
- `npm run --silent observability:diagnostics`
- `npm run --silent e2e:staging:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

If local npm remains blocked by `Bad CPU type in executable`, record it exactly and rely on GitHub Foundation Validation. SQL/RLS stays draft-only.

## GitHub Requirement

- Branch: `codex/rp-foundation-18-e2e-staging-smoke-test-plan`
- PR title: `[foundation] Prompt 18 E2E staging smoke test plan`
- PR base: `codex/rp-foundation-17-observability-audit-abuse-cost-controls`
- Do not merge the PR.

## Acceptance Criteria

- E2E staging smoke plan exists.
- Beta readiness gate contract exists.
- Scenario matrix exists.
- Fixture contract exists.
- Staging smoke runbook exists.
- Beta readiness scorecard exists.
- Production beta blocker inventory exists.
- E2E staging diagnostics exist and pass.
- Draft RLS smoke test exists and remains draft-only.
- No staging or production execution is enabled.
- Prompt 19 or Prompt 18A recommendation is clear.

## Exact Capability Enabled

None; E2E staging smoke plan/diagnostics only.
