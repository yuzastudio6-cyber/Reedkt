# Prompt 01 - Production Architecture Freeze

## Context

Repository: `yuzastudio6-cyber/Reedkt`

Prompt 0 created the source-of-truth foundation. Prompt 1 freezes the architecture boundaries so future prompts cannot bypass approval gates, credits, approved snapshots, RLS, storage privacy, worker claims, provider safety, render readiness, or tool compliance.

ReeditPro is chat-native, but production execution must be record-native. Workers execute approved snapshots and trusted record IDs, not raw chat.

## Scope

This is a documentation and architecture-contract milestone only. It defines what belongs in the frontend, backend API, Supabase, storage runtime, credit runtime, workers, provider gateway, render pipeline, and future tool execution layer.

Branching requirement:

- If Prompt 0 PR branch exists, branch from `origin/codex/rp-foundation-00-source-of-truth`.
- If Prompt 0 has already merged, branch from `origin/codex/reeditpro-planning-stack`.
- New branch: `codex/rp-foundation-01-production-architecture-freeze`.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/milestone-00-source-of-truth-audit.md`
- `product-plan.md`
- `intent-led-edit-planning.md`
- `database-architecture.md`
- `backend-database-roadmap.md`
- `approved-plan-snapshot-policy.md`
- `worker-tool-runtime-architecture.md`
- `generation-provider-architecture.md`
- `render-strategy-planner.md`
- `remotion-renderer-plan.md`
- `open-source-tool-registry.md`
- `mock-vs-real-status.md`
- `production-readiness-review.md`
- `docs/backend-api-route-map.md`
- `docs/backend-runtime-readiness-audit.md`
- `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`
- `docs/e2e-readiness/RP-E2E-READY-01-worker-tool-readiness.md`
- `supabase/migration-order.md`
- `database-migration-readiness-checklist.md`

## Deliverables

- Create `docs/production-architecture-freeze.md`.
- Create `docs/architecture-boundary-matrix.md`.
- Create `docs/execution-gates-contract.md`.
- Create `docs/future-backend-service-map.md`.
- Create `docs/future-worker-lanes.md`.
- Update `PRODUCTION_FOUNDATION_STATUS.md`.
- Update `docs/source-of-truth-map.md`.
- Update `docs/production-milestone-plan.md`.
- Update `docs/implementation-prompts/README.md`.
- Create this implementation prompt record.

## Non-Goals

- No production backend execution.
- No service-role writes or handlers.
- No provider calls.
- No rendering.
- No Stripe.
- No migrations.
- No Cloud Run deployment.
- No worker execution.
- No real storage uploads.
- No package installation.
- No tool execution.
- No credentials, env secrets, service-role keys, signed URLs, private media, or provider keys.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Confirm only Markdown/docs changed.
- If only Markdown/docs changed, build/lint are not required.
- Do not install packages.
- Do not modify `package-lock.json`.
- Do not run Supabase migrations.
- Do not deploy.
- Do not call providers.
- Do not render media.
- Do not execute tools.
- Do not enable Stripe.
- Do not add production service-role handlers.

## GitHub Requirement

- Commit changes with a clear message.
- Push the branch to GitHub.
- Open a pull request if possible.
- PR title: `[foundation] Prompt 1 production architecture freeze`
- PR base:
  - `codex/rp-foundation-00-source-of-truth` if Prompt 0 is still open.
  - Otherwise `codex/reeditpro-planning-stack`.
- PR body must summarize changes, validation, and explicitly state that no production execution was enabled.
- Do not merge the PR.

## Acceptance Criteria

- The repo has a clear production architecture boundary contract.
- Future prompts know which layer owns each capability.
- Execution gates are documented as reusable contracts.
- Future backend services are mapped.
- Future worker lanes are mapped.
- Prompt 1 is tracked in implementation prompts.
- No production execution is enabled.

## Required Final Report

Return:

1. Branch name.
2. PR link if created.
3. Commit hash or commit summary.
4. Files changed.
5. Validation run.
6. Exact statement: "No production backend execution, provider call, rendering, Stripe, migration, deployment, worker execution, service-role handler, or tool execution was enabled."
7. Any blockers.
8. Recommended next prompt: Prompt 2 - Supabase Schema Review and Migration Validation.
