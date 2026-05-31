# Prompt 02A - Schema Gap Fix Plan

## Small Context

Prompt 0 created the production source-of-truth foundation. Prompt 1 froze architecture boundaries. Prompt 2 reviewed the Supabase schema and found duplicate table concepts across schema eras. Prompt 2A creates the canonical schema decision map and Prompt 3 guardrails without changing SQL.

## Scope

- Decide the canonical schema target for future backend work.
- Classify schema eras and source files.
- Resolve duplicate table concepts at the documentation/architecture level.
- Define the canonical relationship chain and service-to-table targets.
- Decide whether Prompt 3 may proceed.
- Prepare guardrails for Prompt 3 auth/profile/workspace/RLS work.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/production-architecture-freeze.md`
- `docs/architecture-boundary-matrix.md`
- `docs/execution-gates-contract.md`
- `docs/supabase-schema-review-report.md`
- `docs/supabase-migration-validation-runbook.md`
- `docs/rls-and-storage-policy-validation-plan.md`
- `docs/schema-conflict-inventory.md`
- `docs/schema-validation-results.md`
- `docs/generated/supabase-schema-static-audit.json`
- `database-architecture.md`
- `backend-database-roadmap.md`
- `database-migration-readiness-checklist.md`
- `supabase/migration-order.md`
- `supabase/migration-audit.md`
- `supabase/README.md`
- `supabase-schema-planning-bridge.md`
- `supabase-table-specification.md`
- `docs/storage-upload-schema-audit.md`
- `docs/credit-runtime-schema-audit.md`
- `docs/job-runtime-schema-audit.md`
- `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`
- `supabase/migrations/`
- `database/migration-drafts/`
- `database/test-sql/`

## Deliverables

- `docs/schema-gap-fix-plan.md`
- `docs/canonical-schema-contract.md`
- `docs/table-concept-resolution-matrix.md`
- `docs/schema-era-deprecation-plan.md`
- `docs/prompt-03-schema-target-guardrails.md`
- Updates to `docs/schema-conflict-inventory.md`
- Updates to `docs/supabase-schema-review-report.md`
- Updates to `PRODUCTION_FOUNDATION_STATUS.md`
- Updates to `docs/source-of-truth-map.md`
- Updates to `docs/production-milestone-plan.md`
- Updates to `docs/implementation-prompts/README.md`

## Non-Goals

- No production migration.
- No remote Supabase connection.
- No staging migration.
- No backend service-role handlers.
- No provider calls.
- No rendering.
- No Stripe.
- No worker execution.
- No tool execution.
- No package installation.
- No SQL execution.
- No schema-changing migration.
- No deletion of historical docs or migrations.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Run existing static audit if available with `npm run schema:static-audit` or `node scripts/validation/supabase-schema-static-audit.mjs`.
- If only Markdown/docs are touched, build/lint are not required; state that clearly.
- If `package.json` or TypeScript/code files are touched, run `npm run build` and `npm run lint`.
- Do not install packages.
- Do not modify `package-lock.json` unless absolutely necessary.
- Do not add credentials, env secrets, service-role keys, signed URLs, private media, provider keys, or raw secrets.
- Do not run remote Supabase migrations.
- Do not deploy anything.
- Do not call providers.
- Do not render media.
- Do not execute tools.
- Do not enable Stripe.
- Do not add production service-role handlers.

## GitHub Push/PR Requirement

- Branch from `origin/codex/rp-foundation-02-supabase-schema-review-validation` while Prompt 2 is open.
- Create branch `codex/rp-foundation-02a-schema-gap-fix-plan`.
- Commit changes with clear messages.
- Push the branch.
- Open a PR titled `[foundation] Prompt 2A schema gap fix plan`.
- Use base `codex/rp-foundation-02-supabase-schema-review-validation` while Prompt 2 is open.
- Do not merge the PR.

## Acceptance Criteria

- Canonical schema contract exists.
- Duplicate concept resolution matrix exists.
- Schema era deprecation plan exists.
- Prompt 3 guardrails exist.
- Prompt 2 conflict inventory is updated.
- Prompt 2A is tracked in implementation prompts.
- It is clear whether Prompt 3 may proceed.
- No production execution is enabled.
