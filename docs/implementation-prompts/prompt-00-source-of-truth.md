# Prompt 00 - Source-Of-Truth Consolidation

## Context

Repository: `yuzastudio6-cyber/Reedkt`

Goal: create a clean source-of-truth foundation for future production backend work so later prompts know what is real, mock-only, planned, blocked, and authoritative.

ReeditPro is a web-first, chat-native AI video editing platform. It must never start expensive AI editing, rendering, generation, provider calls, worker execution, or credit spending until the user approves the edit plan and credit estimate. Future workers must execute approved plan snapshots, not raw chat.

## Scope

This is a documentation and repo organization milestone only. It consolidates production foundation truth and implementation prompt tracking.

Base branch requirement:

- Prefer `origin/codex/reeditpro-planning-stack`.
- Create branch `codex/rp-foundation-00-source-of-truth`.
- If the planning-stack branch is unavailable, use the default branch and document the limitation.

## Tasks

- Fetch latest `origin`.
- Create a dedicated working branch.
- Inspect the requested source docs before editing:
  - `README.md`
  - `AGENTS.md`
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
  - `docs/backend-readiness-gap-report.md`
  - `docs/top-10-missing-implementation-gaps.md`
  - `docs/implementation-gap-scorecard.md`
  - `docs/backend-api-route-map.md`
  - `docs/backend-runtime-readiness-audit.md`
  - `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`
  - `docs/e2e-readiness/RP-E2E-READY-01-worker-tool-readiness.md`
  - `docs/e2e-readiness/RP-E2E-READY-01-tool-bootstrap.md`
  - `supabase/migration-order.md`
  - `database-migration-readiness-checklist.md`
- Create `PRODUCTION_FOUNDATION_STATUS.md`.
- Create `docs/source-of-truth-map.md`.
- Create `docs/milestone-00-source-of-truth-audit.md`.
- Create `docs/production-milestone-plan.md`.
- Create this implementation prompt record.
- Optionally create `docs/implementation-prompts/README.md`.
- Update `README.md` near Current Repo Status with links to the production foundation docs.
- Update `AGENTS.md` with required reading and future implementation prompt rules.

## Non-Goals

- No production backend logic.
- No database migration execution.
- No provider calls.
- No rendering.
- No Stripe.
- No worker execution.
- No real Supabase writes.
- No Google Cloud deployment.
- No package installation.
- No tool execution.
- No credentials, env secrets, API keys, service-role keys, signed URLs, or private media.
- No package-lock modifications unless absolutely necessary.

## Acceptance Criteria

- `PRODUCTION_FOUNDATION_STATUS.md` is the root production status page and includes:
  - current repo reality
  - status label definitions
  - area-by-area production status table
  - explicit non-goals
  - recommended next prompt
- `docs/source-of-truth-map.md` maps the authoritative docs for the requested domains.
- `docs/milestone-00-source-of-truth-audit.md` records what was inspected, what exists, what is missing, what is mock-only, what is blocked, what is safe next, what must not be built yet, risks, and Prompt 1 recommendation.
- `docs/production-milestone-plan.md` includes milestones 0 through 17 in the requested sequence.
- `README.md` and `AGENTS.md` point future backend/tool work to the source-of-truth docs.
- Optional prompt tracking README exists if useful.
- Only Markdown/docs are touched.

## Validation Checklist

- Run `git diff --check`.
- If only Markdown/docs are touched, state that build/lint were not required.
- Do not run Supabase migrations.
- Do not deploy.
- Do not call providers.
- Do not render media.
- Do not execute tools.
- Do not install packages.

## GitHub Requirement

- Commit changes with a clear message.
- Push the branch to GitHub.
- Open a pull request if possible.
- PR title: `[foundation] Prompt 0 source-of-truth consolidation`
- PR base: `codex/reeditpro-planning-stack` if available, otherwise the default branch.
- PR body must summarize changes, validation, and explicitly state that no production execution was enabled.
- Do not merge the PR.

## Required Final Report

Return:

1. Branch name.
2. PR link if created.
3. Commit hash or commit summary.
4. Files changed.
5. Validation run.
6. Exact statement: "No production backend execution, provider call, rendering, Stripe, migration, deployment, or tool execution was enabled."
7. Any blockers.
8. Recommended next prompt: Prompt 1 - Production Architecture Freeze.
