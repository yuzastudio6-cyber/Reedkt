# Prompt 24A - Supabase Read-Only Audit Evidence Intake

## Summary

Prompt 24A creates the read-only Supabase audit evidence intake package. It records where redacted evidence may be supplied, how it must be redacted, how the evidence matrix is evaluated, and why the default state remains `evidence_required`.

Branch: `codex/rp-foundation-24a-supabase-project-readonly-audit-evidence-intake`

PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/182

Exact capability enabled: `none; Supabase read-only audit evidence intake only`.

## Allowed Scope

- Documentation for evidence intake.
- Redaction rules and evidence checklist.
- Evidence request material.
- Evidence matrix defaults.
- Static diagnostics using Node built-ins only.
- Tracker and status updates.

## Forbidden Scope

- Supabase lifecycle commands.
- SQL execution.
- Migrations.
- `psql`.
- Do not run `supabase start`, `supabase status`, `supabase db reset`, `supabase link`, or `supabase db push`.
- Staging, remote, or production Supabase execution.
- Dashboard mutation.
- Provider calls.
- Tool execution.
- Worker execution.
- Rendering/export.
- Media processing.
- Storage transfer.
- Credit mutation.
- Stripe.
- Telemetry.
- Human approval grant.
- Staging execution approval.
- Production readiness.
- Beta unlock.

## Deliverables

- `docs/supabase-readonly-audit-evidence-intake.md`
- `docs/supabase-readonly-audit-evidence-checklist.md`
- `docs/supabase-readonly-audit-redaction-rules.md`
- `docs/supabase-readonly-audit-evidence-matrix.md`
- `docs/supabase-readonly-audit-evidence-request.md`
- `docs/supabase-readonly-audit-evidence/README.md`
- `docs/prompt-24a-validation-results.md`
- `scripts/validation/supabase-project-readonly-evidence-intake-diagnostics.mjs`
- tracker updates

## Evidence State

- Evidence status: `evidence_required`.
- Redaction status: `not_applicable_no_evidence`.
- Audit status: `evidence_required`.
- Evidence files found: none.
- Staging SQL approved: no.
- Production readiness approved: no.
- Beta unlock approved: no.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-24-supabase-project-read-only-audit...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
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
- optional build commands if safe

## Acceptance Criteria

- Required Prompt 24A docs exist.
- Evidence paths are enumerated.
- Evidence matrix defaults to `missing` for every required category.
- Diagnostics fail on unsafe evidence or false audit completion claims.
- No Supabase environment is touched.
- No SQL is executed.
- Trackers state that evidence is still required.
- Next prompt recommendation is clear.
