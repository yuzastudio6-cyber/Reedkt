# Prompt 03B - Auth RLS Validation Environment Fix

## Small Context

Prompt 0 consolidated the production source of truth. Prompt 1 froze architecture boundaries. Prompt 2 reviewed the Supabase schema. Prompt 2A created canonical schema guardrails. Prompt 3 added the limited auth/profile/workspace/project foundation. Prompt 3A hardened that foundation and passed lint/server typecheck, but full build and local RLS validation remained environment-blocked. Prompt 3B diagnoses and documents those validation blockers without expanding scope.

## Allowed Scope

- Validation scripts.
- Validation runbooks and result docs.
- Local-only diagnostics that do not connect to Supabase or execute SQL.
- Package scripts needed to run diagnostics.
- Auth/profile/workspace/project validation docs.
- Build/lint/typecheck/RLS validation reporting.
- RLS test status decision.

## Forbidden Scope

- Storage uploads.
- Media records.
- Planning records.
- Approved snapshots.
- Credit ledger mutation.
- Job execution.
- Worker claims.
- Provider gateway.
- Render jobs.
- Tool execution.
- Stripe.
- Schema-changing migrations.
- Remote or staging Supabase connections.
- Production service-role behavior.
- Dependency upgrades, package-lock rewrites, or committed dependency artifacts.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/production-architecture-freeze.md`
- `docs/architecture-boundary-matrix.md`
- `docs/execution-gates-contract.md`
- `docs/schema-gap-fix-plan.md`
- `docs/canonical-schema-contract.md`
- `docs/prompt-03-schema-target-guardrails.md`
- `docs/auth-profile-workspace-production-path.md`
- `docs/auth-profile-workspace-hardening-checklist.md`
- `docs/auth-profile-workspace-rls-test-plan.md`
- `docs/auth-profile-workspace-route-contract.md`
- `docs/prompt-03-validation-results.md`
- `docs/prompt-03a-auth-rls-fix-results.md`
- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`
- `scripts/validation/supabase-schema-static-audit.mjs`
- `package.json`
- `package-lock.json`
- Vite and TypeScript config files
- Prompt 3/3A auth/project route, service, validation, and route metadata files

## Deliverables

- Create `docs/auth-rls-validation-environment-runbook.md`.
- Create `scripts/validation/auth-rls-validation-diagnostics.mjs`.
- Add package script `auth:rls:diagnostics`.
- Create `docs/prompt-03b-validation-environment-results.md`.
- Update Prompt 3/3A auth, RLS, validation, status, source-of-truth, milestone, and implementation-prompt records.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Run static audit with `npm run schema:static-audit` or the direct Node script.
- Run or attempt `npm ci`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run build`.
- Run `npm run auth:rls:diagnostics` or the direct Node script.
- If local Supabase CLI works and RLS SQL is executable, run local RLS validation.
- If Supabase CLI is unavailable or incompatible, document the exact blocker.
- Do not run remote/staging Supabase.
- Do not deploy, call providers, render media, execute tools, enable Stripe, modify production schema, or commit dependency artifacts.

## GitHub Push/PR Requirement

- Branch from `origin/codex/rp-foundation-03a-auth-rls-fix-validation` while Prompt 3A is open.
- Create branch `codex/rp-foundation-03b-auth-rls-validation-environment-fix`.
- Commit changes with clear messages.
- Push the branch.
- Open a PR titled `[foundation] Prompt 3B auth RLS validation environment fix`.
- Use base `codex/rp-foundation-03a-auth-rls-fix-validation` while Prompt 3A is open.
- Do not merge the PR.

## Acceptance Criteria

- Prompt 3A build/lint/RLS blockers are diagnosed.
- Lint and server typecheck status are known.
- Full build status is known with the exact blocker if not passing.
- Supabase CLI/RLS status is known with the exact blocker if not passing.
- Blocked table scan result is documented.
- Prompt 4 decision is explicit.
- No product scope expansion occurred.
- No storage, media, planning, credits, jobs, workers, providers, rendering, tools, or billing capability is enabled.
