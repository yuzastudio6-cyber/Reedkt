# Prompt 6 - Credit Ledger And Approval Gate Runtime

## Small Context

Prompt 0 consolidated source-of-truth docs. Prompt 1 froze architecture boundaries. Prompt 2 reviewed Supabase schema. Prompt 2A selected canonical schema targets. Prompt 3 through 3C established and validated the auth/profile/workspace/project foundation. Prompt 4 added a limited storage/upload foundation. Prompt 5 added a limited approved snapshot foundation. Prompt 6 adds the limited credit route/service foundation that future execution gates will rely on.

## Allowed Scope

- Credit route/service contracts.
- Credit readiness and blockers.
- Credit estimate, approval, reservation, ledger, spend, release, and refund input validation.
- Canonical fail-closed route behavior.
- Read-only gate checks when backend admin runtime exists.
- Static diagnostics and draft-only SQL/RLS plans.

## Forbidden Scope

- Stripe checkout, webhooks, payment processing, grants, or billing.
- Real credit estimate, reservation, ledger, approval, refund, or wallet mutation.
- Jobs, workers, providers, rendering, tools, media analysis, storage upload/download execution, planning generation, deployment, remote Supabase execution, or schema-changing migrations.
- Broad service-role handlers or production secrets.

## Canonical Tables

- `credit_estimates`
- `credit_estimate_items`
- `approval_records`
- `approved_plan_snapshots`
- `credit_reservations`
- `credit_ledger_entries`
- `refund_records`
- `projects`
- `workspaces`
- `workspace_members`

## Deliverables

- `docs/credit-ledger-approval-gate-runtime.md`
- `docs/credit-ledger-route-contract.md`
- `docs/credit-gate-contract.md`
- `docs/prompt-06-validation-results.md`
- `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql`
- `scripts/validation/credit-scope-diagnostics.mjs`
- Hardened credit service/routes/schemas and route metadata.
- Updated production status, source-of-truth map, milestone plan, and prompt tracker.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check origin/codex/rp-foundation-05-approved-plan-snapshot-service...HEAD`.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run --silent schema:static-audit`.
- Run `npm run --silent auth:rls:diagnostics`.
- Run `npm run --silent storage:scope:diagnostics`.
- Run `npm run --silent snapshot:scope:diagnostics`.
- Run `npm run --silent credit:scope:diagnostics`.
- Run `npm run foundation:validate`.
- Run `npm run foundation:validate:with-build`.
- Do not run remote/staging Supabase.
- Keep SQL/RLS draft-only unless a repaired local Supabase environment is explicitly available.

## GitHub Requirement

- Branch: `codex/rp-foundation-06-credit-ledger-approval-gate-runtime`
- Base: `codex/rp-foundation-05-approved-plan-snapshot-service`
- PR title: `[foundation] Prompt 6 credit ledger approval gate runtime`
- Do not merge the PR.
- After PR creation, update the implementation prompt tracker with the PR link.

## Acceptance Criteria

- Credit routes fail closed for writes and do not fake reservations or approvals.
- Canonical Prompt 2A/5 tables are targeted.
- Legacy credit approval/wallet/refund table concepts are not production-path targets.
- Route contracts and gate contracts are documented.
- Credit scope diagnostics run in foundation validation.
- Draft SQL/RLS test plan exists.
- No blocked production capability is enabled.
