# Prompt 25 - Staging Supabase/RLS Dry-Run Command Packet

## Summary

Prompt 25 creates a future staging Supabase/RLS dry-run command packet from the Prompt 24A evidence intake base.

- Branch: `codex/rp-foundation-25-staging-supabase-rls-dry-run-command-packet`
- PR: pending
- PR base: `codex/rp-foundation-24a-supabase-project-readonly-audit-evidence-intake`
- Exact capability enabled: none; staging Supabase/RLS dry-run command packet only.

## Decision State

- Dry-run packet status: `blocked_missing_evidence`.
- Human approval status: `blocked_missing_approval`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.

## Allowed Scope

- Documentation.
- Static diagnostics.
- Foundation validation wiring.
- Workflow branch trigger coverage.
- Tracker updates.
- Future command templates using placeholders only.

## Forbidden Scope

- Supabase lifecycle commands.
- SQL execution.
- Migrations.
- No `psql`.
- No `supabase link`.
- No `supabase db push`.
- Staging Supabase execution.
- Remote Supabase execution.
- Production Supabase execution.
- Deployment.
- Providers.
- Tools.
- Workers.
- Rendering/export.
- Media processing.
- Storage transfer.
- Credit mutation.
- Stripe.
- Telemetry.
- Dependency mutation.
- Human approval grant.
- Staging execution approval.
- Production or beta unlock.

## Deliverables

- `docs/staging-supabase-rls-dry-run-command-packet.md`
- `docs/staging-supabase-command-safety-checklist.md`
- `docs/staging-supabase-command-evidence-template.md`
- `docs/staging-supabase-test-command-matrix.md`
- `docs/staging-supabase-dry-run-go-no-go-checklist.md`
- `docs/staging-supabase-future-command-templates.md`
- `docs/prompt-25-validation-results.md`
- `scripts/validation/staging-supabase-dry-run-command-packet-diagnostics.mjs`
- Tracker and validation-runner updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-24a-supabase-project-readonly-audit-evidence-intake...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent staging:supabase:dry-run-packet:diagnostics`
- `npm run --silent supabase:project:readonly-audit:diagnostics`
- `npm run --silent supabase:project:evidence-intake:diagnostics`
- `npm run --silent supabase:milestone:sync:diagnostics`
- `npm run --silent staging:supabase:approval:diagnostics`
- `npm run --silent staging:supabase:approval-review:diagnostics`
- `npm run --silent staging:supabase:approval-decision:diagnostics`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- Optional: `npm run build`, `npm run build:server`, `npm run foundation:validate:with-build`

## Acceptance Criteria

- Prompt 25 docs exist.
- Every command-template block includes `DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.`
- Test matrix includes the local passed SQL candidate plus draft SQL files `006` through `020`.
- Diagnostics pass and are wired into foundation validation.
- Trackers reference Prompt 25.
- No staging execution, SQL execution, migration deployment, Supabase environment mutation, human approval grant, production readiness, or beta unlock is claimed.

## Recommended Next Prompt

Prompt 23A - Human Approval Decision Completion and Prompt 24B - Supabase Redacted Evidence Review remain prerequisites before any Prompt 26 staging Supabase/RLS validation execution.
