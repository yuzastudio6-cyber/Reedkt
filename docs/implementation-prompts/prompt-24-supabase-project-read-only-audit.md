# Prompt 24 - Supabase Project Read-Only Audit

## Summary

Prompt 24 creates a read-only Supabase project inventory and audit package from `origin/codex/rp-foundation-23s-supabase-milestone-sync-policy-v2`.

- Branch: `codex/rp-foundation-24-supabase-project-read-only-audit`
- PR base: `codex/rp-foundation-23s-supabase-milestone-sync-policy-v2`
- PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/179
- GitHub Foundation Validation: passed on run `26979478618`, job `79614797621`.
- Exact capability enabled: `none; Supabase project read-only audit packet only`.

## Scope

Allowed:

- read-only audit docs;
- inventory checklist;
- redacted evidence template;
- project activity gap analysis;
- read-only audit runbook;
- audit result template;
- drift risk register;
- static diagnostics;
- tracker updates.

Forbidden:

- Supabase lifecycle commands;
- SQL execution;
- migrations;
- `psql`;
- project linking;
- remote database pushes;
- dashboard mutation;
- staging/remote/production Supabase execution;
- deployment;
- providers, tools, workers, rendering, media/storage/credit/Stripe commands;
- external telemetry;
- dependency mutation;
- human approval grant;
- staging execution approval;
- beta/production unlock.

## Deliverables

- `docs/supabase-project-read-only-audit.md`
- `docs/supabase-project-inventory-checklist.md`
- `docs/supabase-redacted-evidence-template.md`
- `docs/supabase-project-activity-gap-analysis.md`
- `docs/supabase-read-only-audit-runbook.md`
- `docs/supabase-read-only-audit-result-template.md`
- `docs/supabase-project-drift-risk-register.md`
- `docs/prompt-24-validation-results.md`
- `scripts/validation/supabase-project-readonly-audit-diagnostics.mjs`

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-23s-supabase-milestone-sync-policy-v2...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:project:readonly-audit:diagnostics`
- `npm run --silent supabase:milestone:sync:diagnostics`
- `npm run --silent staging:supabase:approval:diagnostics`
- `npm run --silent staging:supabase:approval-review:diagnostics`
- `npm run --silent staging:supabase:approval-decision:diagnostics`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Audit status is `evidence_required`.
- Read-only audit docs exist.
- Redacted evidence template exists.
- Diagnostics exist and pass.
- Trackers record Prompt 24.
- No Supabase environment is touched.
- No SQL runs.
- No staging or production audit completion is claimed without redacted evidence.
- Next prompt recommendation is clear.

## Prompt 24A Follow-Up

Prompt 24A adds evidence intake, redaction rules, an evidence matrix, and diagnostics. Actual redacted evidence is still required; Prompt 24A does not change audit status from `evidence_required`.
