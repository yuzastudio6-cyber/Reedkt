# Prompt 26A - Connected Supabase Read-Only Audit and Advisor Triage

## Summary

Implement Prompt 26A from a clean sibling worktree based on `origin/codex/rp-foundation-24c-supabase-evidence-collection-follow-up`.

- Branch: `codex/rp-foundation-26a-connected-supabase-readonly-audit-triage`
- PR title: `[foundation] Prompt 26A connected Supabase read-only audit triage`
- PR: [#197](https://github.com/yuzastudio6-cyber/Reedkt/pull/197)
- Exact capability enabled: none; connected Supabase read-only audit triage only

## Allowed Scope

- Record supplied connected Supabase read-only metadata.
- Record supplied advisor findings.
- Create triage plans for RLS no-policy tables, SECURITY DEFINER exposure, mutable function `search_path`, and unindexed foreign keys.
- Update static status trackers.
- Add local file-inspection diagnostics.

## Forbidden Scope

Do not mutate Supabase, run SQL, run local SQL, run staging SQL, run remote SQL, run production SQL, run Supabase lifecycle commands, run `supabase link`, run `supabase db push`, create branches/projects, deploy Edge Functions, fetch keys, call Google Cloud APIs, call Secret Manager APIs, fetch Secret Manager metadata, fetch Secret Manager values, deploy, call providers, render/export, execute tools, execute workers, process media, transfer storage, create signed URLs, mutate credits, run Stripe, run telemetry, grant human approval, approve staging execution, unlock production/beta, or add broad service-role handlers.

## Deliverables

- `docs/connected-supabase-readonly-audit-record.md`
- `docs/connected-supabase-advisor-triage.md`
- `docs/connected-supabase-rls-no-policy-inventory.md`
- `docs/connected-supabase-security-definer-triage.md`
- `docs/connected-supabase-function-search-path-triage.md`
- `docs/connected-supabase-performance-advisor-triage.md`
- `docs/prompt-26a-validation-results.md`
- `docs/implementation-prompts/prompt-26a-connected-supabase-readonly-audit-triage.md`
- `scripts/validation/connected-supabase-readonly-audit-diagnostics.mjs`
- package script and foundation validation runner wiring.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-24c-supabase-evidence-collection-follow-up...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:connected-readonly-audit:diagnostics`
- Existing Supabase/GCP/staging diagnostics.
- Local Supabase toolchain probe/preflight only.
- RLS list-tests and dry-run only.

## Acceptance Criteria

- Connected metadata is recorded with redacted project ref only.
- Advisor findings are triaged, not remediated.
- Audit status is `partially_reviewed_connected_metadata`.
- Redacted evidence and Secret Manager metadata evidence remain incomplete.
- No Supabase, Google Cloud, Secret Manager, SQL, migration, deployment, runtime execution, approval, or beta/production capability is enabled.
