# Prompt 22 - Staging Supabase/RLS Human Approval Review

## Summary

Prompt 22 adds a human approval review packet for the Prompt 21 staging Supabase/RLS approval materials.

- Branch: `codex/rp-foundation-22-staging-supabase-rls-human-approval-review`
- PR base: `codex/rp-foundation-21-staging-supabase-rls-approval-packet`
- PR: pending
- Status: open / pending validation
- Exact capability enabled: `none; human approval review packet only`

## Small Context

Prompt 20B-Retry passed exactly one guarded local auth/profile/workspace/project RLS smoke path. Prompt 21 prepared the staging approval packet. Prompt 22 reviews that packet for human decision readiness but does not grant approval.

## Allowed Scope

- Human approval review docs.
- Human checklist.
- Decision template.
- Evidence template.
- Go/no-go rubric.
- Static diagnostics.
- Tracker updates.

## Forbidden Scope

- Do not run staging Supabase.
- Do not run remote Supabase.
- Do not run production Supabase.
- Do not run local SQL.
- Do not run staging SQL.
- Do not run migrations.
- Do not deploy.
- Do not call providers.
- Do not render or export media.
- Do not execute tools.
- Do not execute workers.
- Do not process media.
- Do not mutate storage, credits, or Stripe.
- Do not unlock beta or production.
- Do not grant human approval.

## Deliverables

- `docs/staging-supabase-human-approval-review.md`
- `docs/staging-supabase-human-approval-checklist.md`
- `docs/staging-supabase-approval-decision-template.md`
- `docs/staging-supabase-validation-evidence-template.md`
- `docs/staging-supabase-go-no-go-rubric.md`
- `docs/prompt-22-validation-results.md`
- `scripts/validation/staging-supabase-human-approval-review-diagnostics.mjs`
- Tracker updates in status, source map, milestone plan, scorecard, blocker inventory, and implementation prompt index.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-21-staging-supabase-rls-approval-packet...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent staging:supabase:approval:diagnostics`
- `npm run --silent staging:supabase:approval-review:diagnostics`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Human review packet exists.
- Review state is `ready_for_human_review`, not approved.
- Prompt 20B-Retry evidence is described as narrow local evidence only.
- Prompt 21 packet is referenced.
- Human approval remains required before staging execution.
- Staging/remote/production Supabase remains untouched.
- SQL remains unrun in Prompt 22.
- Production beta remains blocked.
- Prompt 23 or Prompt 22A recommendation is clear.
