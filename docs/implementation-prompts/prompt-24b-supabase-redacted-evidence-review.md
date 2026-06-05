# Prompt 24B - Supabase Redacted Evidence Review

## Summary

Implement Prompt 24B from a clean sibling worktree based on `origin/codex/rp-foundation-25a-gcp-secret-manager-supabase-reference-contract`.

- Branch: `codex/rp-foundation-24b-supabase-redacted-evidence-review`
- PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/190
- PR title: `[foundation] Prompt 24B Supabase redacted evidence review`
- Exact capability enabled: none; Supabase redacted evidence review only

## Allowed Scope

- Inspect tracked files under approved redacted evidence paths only.
- Classify evidence categories.
- Update redacted evidence review docs, result templates, diagnostics, and trackers.
- Run local static validation and diagnostics only.

## Forbidden Scope

Do not run Google Cloud APIs, Secret Manager APIs, Secret Manager metadata fetches, Secret Manager value fetches, Supabase lifecycle commands, SQL, `psql`, migrations, deployment, providers, tools, workers, rendering/export, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval grants, staging execution approvals, production readiness approvals, or beta unlocks.

## Deliverables

- `docs/supabase-redacted-evidence-review.md`
- `docs/prompt-24b-validation-results.md`
- `docs/implementation-prompts/prompt-24b-supabase-redacted-evidence-review.md`
- `scripts/validation/supabase-redacted-evidence-review-diagnostics.mjs`
- Updated evidence matrix, audit result template, foundation validation runner, package script, workflow trigger, and trackers.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-25a-gcp-secret-manager-supabase-reference-contract...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:redacted-evidence:review:diagnostics`
- Existing Prompt 21-25 diagnostics
- Local Supabase toolchain probe/preflight
- RLS list-tests and dry-run only

## Acceptance Criteria

- Evidence status remains `evidence_required` when no non-instruction evidence files exist.
- Redaction status remains `not_applicable_no_evidence`.
- Audit status remains `evidence_required`.
- No unsafe evidence is printed.
- No Google Cloud, Secret Manager, Supabase, SQL, migration, deployment, runtime execution, approval, or beta/production capability is enabled.
