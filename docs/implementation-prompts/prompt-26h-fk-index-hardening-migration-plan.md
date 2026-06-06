# Prompt 26H - FK Index Hardening Migration Plan

Branch: `codex/rp-foundation-26h-fk-index-hardening-migration-plan`
Base branch: `origin/codex/rp-foundation-26g-security-definer-exposure-migration-plan`
PR: pending

Exact capability enabled: none; FK index hardening migration plan only.

## Intent

Prompt 26H turns Prompt 26A connected read-only unindexed-FK advisor findings into a docs-only migration planning packet. It does not create active migration SQL, create indexes, run Supabase commands, run SQL, call Google Cloud or Secret Manager, deploy, approve staging, or unlock beta/production.

## Required Deliverables

- `docs/supabase-fk-index-migration-plan.md`
- `docs/supabase-fk-index-priority-matrix.md`
- `docs/supabase-fk-index-duplicate-review-contract.md`
- `docs/supabase-fk-index-naming-contract.md`
- `docs/supabase-fk-index-write-amplification-risk.md`
- `docs/supabase-fk-index-future-test-matrix.md`
- `docs/supabase-fk-index-rollback-cleanup-plan.md`
- `docs/supabase-fk-index-staging-evidence-requirements.md`
- `docs/prompt-26h-validation-results.md`
- `scripts/validation/supabase-fk-index-migration-plan-diagnostics.mjs`

## Safety State

- FK index migration plan status: `fk_index_migration_plan_created`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Active migration files changed: no.
- Production capability enabled: none; FK index hardening migration plan only.

## Recommended Next Prompt

Prompt 26H-1 - FK Index Local Migration Candidate or Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit.

