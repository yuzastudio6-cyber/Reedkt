# Prompt 26G Validation Results

Prompt 26G creates the SECURITY DEFINER exposure migration plan only.

SECURITY DEFINER exposure migration plan status: `security_definer_exposure_migration_plan_created`.
Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Grant/revoke executed: no.
Function altered: no.
Active migration files changed: no.
Google Cloud API touched: false.
Secret Manager API touched: false.
Production capability enabled: none; SECURITY DEFINER exposure migration plan only.

## Files Added

- `docs/supabase-security-definer-exposure-migration-plan.md`
- `docs/supabase-security-definer-function-classification.md`
- `docs/supabase-security-definer-grant-review-contract.md`
- `docs/supabase-security-definer-invoker-decision-contract.md`
- `docs/supabase-security-definer-future-test-matrix.md`
- `docs/supabase-security-definer-rollback-cleanup-plan.md`
- `docs/supabase-security-definer-staging-evidence-requirements.md`
- `docs/prompt-26g-validation-results.md`
- `docs/implementation-prompts/prompt-26g-security-definer-exposure-migration-plan.md`
- `scripts/validation/supabase-security-definer-migration-plan-diagnostics.mjs`

## Files Updated

- `docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md`
- `package.json`
- `scripts/validation/run-foundation-validation.mjs`
- `.github/workflows/foundation-validation.yml`
- Production status, source-of-truth, milestone, blocker, beta readiness, implementation prompt, and advisor sequence trackers.

## Functions Covered

- `has_workspace_role`
- `is_workspace_owner_or_admin`
- `is_workspace_owner_record`
- `set_updated_at`
- `can_export_render`
- `is_project_editor`
- `is_project_member`

## Validation Commands

Local validation was run on 2026-06-06 with the Codex-bundled Node/npm path.

- `git diff --check`: passed.
- `git diff --check origin/codex/rp-foundation-26f-function-search-path-hardening-migration-plan...HEAD`: passed.
- `npm ci`: passed; five moderate npm audit findings were reported and no dependency mutation was made.
- `npm run lint`: passed.
- `npm run typecheck:server`: passed.
- `npm run --silent supabase:security-definer:migration-plan:diagnostics`: passed.
- `npm run --silent supabase:function-search-path:migration-plan:diagnostics`: passed.
- `npm run --silent supabase:advisor:draft-remediation:diagnostics`: passed after restoring the exact Prompt 26C safety sentence in `docs/supabase-security-definer-draft-remediation-packet.md`.
- `npm run foundation:validate`: passed, including existing Prompt 21-26F diagnostics and the new Prompt 26G diagnostic.
- `npm run --silent supabase:local:toolchain:probe`: passed as a non-mutating probe, but reported local setup blockers.
- `npm run --silent supabase:local:preflight`: exited 0 as documented blocked status; `remoteRiskDetected=false`, `canRunLocalSql=false`.
- `npm run supabase:rls:list-tests`: passed; no SQL executed.
- `npm run supabase:rls:local:dry-run`: passed as dry-run; no SQL executed and `callsSupabaseStatus=false`.
- `npm run build`: environment-blocked locally by the known Darwin Rolldown native binding/code-signature issue.
- `npm run build:server`: environment-blocked locally by the known Darwin Rolldown native binding/code-signature issue.
- `npm run foundation:validate:with-build`: required checks passed and optional full build was classified `environment_blocked`.

## Local Supabase Probe Result

- Supabase CLI path: `/usr/local/bin/supabase`.
- Supabase CLI status: blocked locally because the binary is x86_64 on an arm64 host and fails with error `-86`.
- Docker status: Docker CLI and daemon reachable; daemon version `29.5.2`.
- `psql` status: missing from PATH in this validation shell.
- Local DB URL: not verified.
- Remote risk: false.
- Local SQL/RLS tests executed: none.

## Blockers

- Function bodies, grants, and policy dependencies are not accepted executable evidence.
- Prompt 23 remains `pending_human_approval` on this base.
- Prompt 24D accepted evidence is missing.
- Secret Manager references are not verified.
- No local candidate migration exists for SECURITY DEFINER grants or security-mode changes.
- No staging validation has run.
- Local Supabase SQL execution remains blocked in this validation shell by `supabase_cli_arch_mismatch`, `psql_missing`, and `local_db_url_missing`.

## CI Status

- PR: [#227](https://github.com/yuzastudio6-cyber/Reedkt/pull/227).
- GitHub Foundation Validation: pending.

## Next Prompt

Recommended next prompt: `Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate` if grant/function hardening proceeds, or `Prompt 26H - FK Index Hardening Migration Plan` if FK advisor planning is prioritized.
