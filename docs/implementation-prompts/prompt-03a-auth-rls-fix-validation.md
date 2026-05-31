# Prompt 03A - Auth RLS Fix Plan And Validation Hardening

## Small Context

Prompt 0 consolidated the production source of truth. Prompt 1 froze architecture boundaries. Prompt 2 reviewed the Supabase schema. Prompt 2A created canonical schema guardrails. Prompt 3 added the limited auth/profile/workspace/project foundation. Prompt 3A hardens Prompt 3 and improves validation evidence without expanding scope.

## Allowed Scope

- Auth/profile/workspace/project route and service hardening.
- Validation of Prompt 3 code against Prompt 2A guardrails.
- Build/lint/static audit attempts.
- RLS draft test review.
- Documentation of blockers and whether Prompt 4 may proceed.

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
- Remote or staging Supabase connections.
- Schema-changing migrations.
- Service-role handlers outside auth/profile/workspace/project bootstrap/access scope.

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
- `docs/auth-profile-workspace-rls-test-plan.md`
- `docs/auth-profile-workspace-route-contract.md`
- `docs/prompt-03-validation-results.md`
- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`
- Prompt 3 auth/project server files and route metadata.

## Deliverables

- Harden Prompt 3 code inside the allowed boundary.
- Create `docs/prompt-03a-auth-rls-fix-results.md`.
- Create `docs/auth-profile-workspace-hardening-checklist.md`.
- Update Prompt 3 auth/route/RLS/validation docs with Prompt 3A follow-up notes.
- Update status, source-of-truth map, milestone plan, and implementation prompt tracker.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Run static audit with `npm run schema:static-audit` or `node scripts/validation/supabase-schema-static-audit.mjs`.
- If dependencies are missing and `package-lock.json` exists, run `npm ci` for validation only.
- Run `npm run build`.
- Run `npm run lint`.
- Do not install new packages.
- Do not commit `node_modules`.
- Do not modify `package.json` or `package-lock.json`.
- Do not run remote Supabase migrations.
- Do not connect to production/staging Supabase.
- Do not deploy, call providers, render media, execute tools, or enable Stripe.

## GitHub Push/PR Requirement

- Branch from `origin/codex/rp-foundation-03-auth-profile-workspace-rls-production-path` while Prompt 3 is open.
- Create branch `codex/rp-foundation-03a-auth-rls-fix-validation`.
- Commit changes with clear messages.
- Push the branch.
- Open a PR titled `[foundation] Prompt 3A auth RLS fix and validation`.
- Use base `codex/rp-foundation-03-auth-profile-workspace-rls-production-path` while Prompt 3 is open.
- Do not merge the PR.

## Acceptance Criteria

- Prompt 3 implementation is reviewed against Prompt 2A guardrails.
- Unsafe scope leaks are fixed or documented as blockers.
- Auth/profile/workspace/project behavior fails closed.
- Build/lint either pass or blockers are clearly recorded.
- RLS SQL status is improved or its blocker is clear.
- Prompt 3A is tracked in implementation prompts.
- It is clear whether Prompt 4 can proceed.
- No storage, media, planning, credits, jobs, workers, providers, rendering, tools, or billing capability is enabled.
