# Prompt 03C - Validation Toolchain Repair

## Small Context

Prompt 0 consolidated production source of truth. Prompt 1 froze architecture boundaries. Prompt 2 reviewed Supabase schema. Prompt 2A created canonical schema guardrails. Prompt 3 implemented the limited auth/profile/workspace/project foundation. Prompt 3A hardened it. Prompt 3B documented local build and Supabase CLI blockers. Prompt 3C creates a reproducible validation route without adding product capability.

## Allowed Scope

- Validation scripts.
- CI validation workflow.
- Local validation runbooks.
- Package scripts for validation only.
- Static/local diagnostics.
- Build/lint/typecheck validation routing.
- Environment-blocker documentation.

## Forbidden Scope

- Storage/upload runtime.
- Media records.
- Planning records.
- Approved snapshots.
- Credit ledger.
- Job execution.
- Worker claims.
- Provider gateway.
- Render execution.
- Tool execution.
- Stripe.
- Schema-changing migrations.
- Remote Supabase validation.
- Deployment.
- Production service-role handlers.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/production-architecture-freeze.md`
- `docs/execution-gates-contract.md`
- `docs/auth-rls-validation-environment-runbook.md`
- `docs/prompt-03b-validation-environment-results.md`
- `docs/prompt-03a-auth-rls-fix-results.md`
- `docs/prompt-03-validation-results.md`
- `docs/auth-profile-workspace-production-path.md`
- `docs/auth-profile-workspace-hardening-checklist.md`
- `docs/auth-profile-workspace-rls-test-plan.md`
- `docs/auth-profile-workspace-route-contract.md`
- `scripts/validation/auth-rls-validation-diagnostics.mjs`
- `scripts/validation/supabase-schema-static-audit.mjs`
- `package.json`
- `package-lock.json`
- Vite and TypeScript config files
- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`

## Deliverables

- Create `scripts/validation/run-foundation-validation.mjs`.
- Add `foundation:validate` and `foundation:validate:with-build` package scripts.
- Add a safe foundation validation GitHub Actions workflow.
- Create `docs/validation-toolchain-repair-runbook.md`.
- Create `docs/prompt-03c-validation-toolchain-results.md`.
- Update Prompt 3B/source-of-truth/milestone/implementation prompt records.

## Validation Checklist

- Run `npm ci`.
- Run `npm run --silent schema:static-audit`.
- Run `npm run --silent auth:rls:diagnostics`.
- Run `npm run foundation:validate`.
- Run `npm run foundation:validate:with-build`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run build`.
- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Do not run remote/staging Supabase.
- Do not run SQL unless a safe local Supabase route exists.
- Do not deploy, call providers, render media, execute tools, enable Stripe, or modify production schema.

## GitHub Push/PR Requirement

- Branch from `origin/codex/rp-foundation-03b-auth-rls-validation-environment-fix` while Prompt 3B is open.
- Create branch `codex/rp-foundation-03c-validation-toolchain-repair`.
- Commit changes with clear messages.
- Push the branch.
- Open a PR titled `[foundation] Prompt 3C validation toolchain repair`.
- Use base `codex/rp-foundation-03b-auth-rls-validation-environment-fix` while Prompt 3B is open.
- Do not merge the PR.

## Acceptance Criteria

- Default foundation validation is reproducible from one package script.
- Full build can be attempted separately and classified as passed, environment-blocked, or code-failed.
- Linux CI route exists for full build validation.
- Supabase CLI/RLS remains honestly documented if still blocked.
- Prompt 4 decision is explicit.
- No product scope expansion occurred.
- No storage, media, planning, credits, jobs, workers, providers, rendering, tools, billing, migration, deployment, or broad service-role capability is enabled.
