# Prompt 26B - Supabase Advisor Hardening Plan

## Summary

Implement Prompt 26B from a clean sibling worktree based on `origin/codex/rp-foundation-26a-connected-supabase-readonly-audit-triage`.

- Branch: `codex/rp-foundation-26b-supabase-advisor-hardening-plan`
- PR title: `[foundation] Prompt 26B Supabase advisor hardening plan`
- PR: [#201](https://github.com/yuzastudio6-cyber/Reedkt/pull/201)
- Exact capability enabled: none; Supabase advisor hardening plan only

## Allowed Scope

- Plan future hardening for Prompt 26A supplied advisor findings.
- Create RLS no-policy, SECURITY DEFINER, function search-path, and FK index hardening plans.
- Update static status trackers.
- Add local file-inspection diagnostics.

## Forbidden Scope

Do not mutate Supabase, run SQL, run local SQL, run staging SQL, run remote SQL, run production SQL, run Supabase lifecycle commands, run `supabase link`, run `supabase db push`, run `psql`, create or deploy migrations, create policies, alter functions, revoke grants, create indexes, call Google Cloud APIs, call Secret Manager APIs, fetch Secret Manager metadata, fetch Secret Manager values, deploy, call providers, render/export, execute tools, execute workers, process media, transfer storage, create signed URLs, mutate credits, run Stripe, run telemetry, grant human approval, approve staging execution, unlock production/beta, or add broad service-role handlers.

## Deliverables

- `docs/supabase-advisor-hardening-plan.md`
- `docs/supabase-advisor-hardening-priority-matrix.md`
- `docs/supabase-rls-no-policy-hardening-plan.md`
- `docs/supabase-security-definer-hardening-plan.md`
- `docs/supabase-function-search-path-hardening-plan.md`
- `docs/supabase-fk-index-hardening-plan.md`
- `docs/supabase-advisor-hardening-prompt-sequence.md`
- `docs/prompt-26b-validation-results.md`
- `scripts/validation/supabase-advisor-hardening-plan-diagnostics.mjs`
- package script and foundation validation runner wiring.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-26a-connected-supabase-readonly-audit-triage...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:advisor:hardening-plan:diagnostics`
- `npm run --silent supabase:connected-readonly-audit:diagnostics`
- Existing Supabase/GCP/staging diagnostics.
- Local Supabase toolchain probe/preflight only.
- RLS list-tests and dry-run only.

## Acceptance Criteria

- Advisor hardening plan exists and uses only Prompt 26A supplied findings.
- RLS no-policy, SECURITY DEFINER, mutable search-path, and FK index workstreams are prioritized.
- Every item remains a future candidate, not an applied remediation.
- Diagnostics pass and are wired into foundation validation.
- No Supabase, Google Cloud, Secret Manager, SQL, migration, deployment, runtime execution, approval, or beta/production capability is enabled.
