# Prompt 24C - Supabase Evidence Collection Follow-Up

## Summary

Implement Prompt 24C from a clean sibling worktree based on `origin/codex/rp-foundation-24b-supabase-redacted-evidence-review`.

- Branch: `codex/rp-foundation-24c-supabase-evidence-collection-follow-up`
- PR title: `[foundation] Prompt 24C Supabase evidence collection follow-up`
- Exact capability enabled: none; Supabase evidence collection follow-up only

## Allowed Scope

- Create operator-facing evidence collection instructions.
- Create concrete redacted evidence templates.
- Create metadata-only GCP Secret Manager evidence guidance.
- Create dashboard screenshot redaction guidance.
- Update evidence matrix, request docs, trackers, and diagnostics.
- Run local static validation and diagnostics only.

## Forbidden Scope

Do not run Google Cloud APIs, Secret Manager APIs, Secret Manager metadata fetches, Secret Manager value fetches, Supabase lifecycle commands, SQL, `psql`, migrations, deployment, providers, tools, workers, rendering/export, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval grants, staging execution approvals, production readiness approvals, or beta unlocks.

## Deliverables

- `docs/supabase-evidence-collection-follow-up.md`
- `docs/supabase-evidence-file-template-index.md`
- `docs/gcp-secret-manager-reference-metadata-evidence-guide.md`
- `docs/supabase-dashboard-screenshot-redaction-guide.md`
- `docs/prompt-24c-validation-results.md`
- `docs/implementation-prompts/prompt-24c-supabase-evidence-collection-follow-up.md`
- `docs/supabase-readonly-audit-evidence/templates/*.template.md`
- `scripts/validation/supabase-evidence-collection-follow-up-diagnostics.mjs`
- Updated evidence matrix, evidence request, foundation validation runner, package script, and trackers.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-24b-supabase-redacted-evidence-review...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:evidence:collection:diagnostics`
- Existing Prompt 21-25 diagnostics
- Local Supabase toolchain probe/preflight only
- RLS list-tests and dry-run only

## Acceptance Criteria

- Evidence status remains `evidence_required` when no non-instruction evidence files exist.
- Redaction status remains `not_applicable_no_evidence`.
- Audit status remains `evidence_required`.
- Templates are not counted as evidence.
- Secret Manager guidance is metadata-only and value access remains blocked.
- No Google Cloud, Secret Manager, Supabase, SQL, migration, deployment, runtime execution, approval, or beta/production capability is enabled.
