# Prompt 02 - Supabase Schema Review And Migration Validation

## Small Context

Prompt 0 created the production source-of-truth foundation. Prompt 1 froze architecture boundaries. Prompt 2 reviews and validates the Supabase schema/migration foundation before production backend service-role handlers, storage uploads, approved snapshots, credits, jobs, render readiness, provider attempts, or tool-call records are implemented.

## Scope

- Review active Supabase migrations.
- Compare active migrations, draft migrations, and database planning docs.
- Inventory RLS, storage policies, helper functions, status lifecycles, JSONB fields, and schema conflicts.
- Create safe validation runbooks and test plans.
- Add a static local-only schema audit script using Node built-in modules only.
- Record actual validation results honestly.

## Required Reading

- `README.md`
- `AGENTS.md`
- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/production-architecture-freeze.md`
- `docs/architecture-boundary-matrix.md`
- `docs/execution-gates-contract.md`
- `docs/future-backend-service-map.md`
- `docs/future-worker-lanes.md`
- `database-architecture.md`
- `backend-database-roadmap.md`
- `database-migration-readiness-checklist.md`
- `supabase/migration-order.md`
- `supabase/migration-audit.md`
- `supabase/README.md`
- `supabase-schema-planning-bridge.md`
- `supabase-table-specification.md`
- `supabase-storage-bucket-draft.md`
- `supabase-rls-policy-draft.md`
- `migration-review-and-rls-hardening.md`
- `rls-hardening-matrix.md`
- `docs/storage-upload-schema-audit.md`
- `docs/credit-runtime-schema-audit.md`
- `docs/job-runtime-schema-audit.md`
- `docs/e2e-readiness/RP-E2E-READY-01-runtime-tables.md`
- `docs/e2e-readiness/RP-E2E-READY-01-upload-storage.md`
- `docs/e2e-readiness/RP-E2E-READY-01-worker-tool-readiness.md`
- `supabase/migrations/`
- `database/migration-drafts/`
- `database/test-sql/`

## Deliverables

- `docs/supabase-schema-review-report.md`
- `docs/supabase-migration-validation-runbook.md`
- `docs/rls-and-storage-policy-validation-plan.md`
- `docs/schema-conflict-inventory.md`
- `docs/schema-validation-results.md`
- `scripts/validation/supabase-schema-static-audit.mjs`
- `docs/generated/supabase-schema-static-audit.json`
- Updates to `PRODUCTION_FOUNDATION_STATUS.md`
- Updates to `docs/source-of-truth-map.md`
- Updates to `docs/production-milestone-plan.md`
- Updates to `docs/implementation-prompts/README.md`

## Non-Goals

- No production migration.
- No remote Supabase connection.
- No staging migration unless explicitly human-approved outside this prompt.
- No backend service-role handlers.
- No provider calls.
- No rendering.
- No Stripe.
- No worker execution.
- No tool execution.
- No package installation.
- No schema-changing migration unless separately justified and clearly documented as non-production/local-only.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check <base>...HEAD`.
- Run `npm run schema:static-audit`.
- Run `npm run build` because code/package files are touched.
- Run `npm run lint` because code/package files are touched.
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

- Branch from `origin/codex/rp-foundation-01-production-architecture-freeze` when Prompt 1 is still open.
- Create branch `codex/rp-foundation-02-supabase-schema-review-validation`.
- Commit changes with a clear message.
- Push the branch.
- Open a PR titled `[foundation] Prompt 2 Supabase schema review and validation`.
- Use base `codex/rp-foundation-01-production-architecture-freeze` while Prompt 1 is open.
- Do not merge the PR.

## Acceptance Criteria

- Migration chain is inventoried.
- Active vs draft schema is reviewed.
- RLS and storage policy validation plan exists.
- Schema conflicts are documented.
- Validation results are honestly recorded.
- Prompt 2 is tracked in `docs/implementation-prompts/`.
- No production execution is enabled.
- Next prompt is recommended based on findings.
