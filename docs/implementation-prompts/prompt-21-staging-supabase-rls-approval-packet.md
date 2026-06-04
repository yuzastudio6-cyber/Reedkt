# Prompt 21 - Staging Supabase/RLS Approval Packet

## Summary

Implement Prompt 21 from a clean sibling worktree based on `origin/codex/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run`.

- Branch: `codex/rp-foundation-21-staging-supabase-rls-approval-packet`
- PR base: `codex/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run`
- PR: Pending
- PR title: `[foundation] Prompt 21 staging Supabase RLS approval packet`
- Exact capability enabled: `none; staging Supabase/RLS approval packet only`

## Context

Prompt 20B-Retry passed the first guarded local-only auth/profile/workspace/project RLS smoke test. That evidence is partial local evidence only. Staging evidence has not been collected, production readiness has not been approved, and broader local domain tests remain draft-only or review-only.

## Allowed Scope

- Create staging approval packet docs.
- Create staging RLS runbook docs.
- Create staging test selection matrix.
- Create synthetic fixture, rollback, cleanup, and risk-register docs.
- Add static diagnostics.
- Update source-of-truth trackers.
- Run local validation that does not execute SQL or Supabase lifecycle commands.

## Forbidden Scope

- Do not run local SQL, staging SQL, remote SQL, or production SQL.
- Do not run staging, remote, or production Supabase.
- Do not run a Supabase lifecycle command.
- Do not run migrations or deploy infrastructure.
- Do not call providers, execute workers, execute tools, render/export, process media, transfer storage, create signed URLs, mutate credits, use Stripe, send external telemetry, or unlock beta/production.
- Do not commit credentials, keys, signed URLs, connection strings, provider secrets, Stripe keys, private media, or generated local evidence.

## Deliverables

- `docs/staging-supabase-rls-approval-packet.md`
- `docs/staging-supabase-rls-runbook.md`
- `docs/staging-rls-test-selection-matrix.md`
- `docs/staging-synthetic-fixture-plan.md`
- `docs/staging-supabase-rollback-cleanup-plan.md`
- `docs/staging-supabase-risk-register.md`
- `docs/prompt-21-validation-results.md`
- `docs/implementation-prompts/prompt-21-staging-supabase-rls-approval-packet.md`
- `scripts/validation/staging-supabase-approval-packet-diagnostics.mjs`
- Package script and foundation validation runner wiring.
- Tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run --silent staging:supabase:approval:diagnostics`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Approval packet clearly distinguishes local evidence from staging evidence and production readiness.
- Test selection matrix marks only `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` as local-passed.
- Fixture plan uses synthetic, cleanupable, workspace/project-isolated fixtures only.
- Rollback/cleanup plan and risk register exist.
- Diagnostics exist and pass.
- No SQL, Supabase lifecycle command, staging/remote/prod Supabase, deployment, runtime execution, or beta unlock occurs.
- Next prompt recommendation is clear.

