# Supabase Migration Validation Runbook

This runbook defines safe validation paths for the ReeditPro Supabase schema. It is a validation plan only. Prompt 2 did not apply local, staging, or production migrations.

## A. Local-Only Validation Path

Prerequisites:

- Work from a dedicated branch.
- Use only disposable local Supabase state.
- Do not use production or staging credentials.
- Confirm the target repository is ReeditPro and the intended remote project name is `reeditpro` before any future link.
- Keep `.env`, service-role keys, provider keys, signed URLs, private media, and credentials out of git.

Safe environment rules:

- Do not run `supabase link` unless a future prompt explicitly approves it.
- Do not run remote database commands.
- Do not run provider, rendering, worker, Stripe, deployment, or tool execution commands.
- Treat every local reset as destructive to local-only data.

Suggested local commands when a human approves disposable local validation:

```bash
supabase --version
supabase status
supabase start
supabase db reset
```

Suggested SQL smoke tests after a successful local reset:

```bash
psql "$LOCAL_SUPABASE_DB_URL" -f database/test-sql/001_rls_smoke_tests.sql
psql "$LOCAL_SUPABASE_DB_URL" -f database/test-sql/002_approved_snapshot_immutability_tests.sql
psql "$LOCAL_SUPABASE_DB_URL" -f database/test-sql/003_storage_policy_smoke_tests.sql
psql "$LOCAL_SUPABASE_DB_URL" -f database/test-sql/004_credit_audit_append_only_tests.sql
psql "$LOCAL_SUPABASE_DB_URL" -f database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql
```

Static checks:

```bash
npm run schema:static-audit
git diff --check
git diff --check origin/codex/rp-foundation-01-production-architecture-freeze...HEAD
```

Local validation acceptance:

- Migration chain applies from empty local state or produces documented conflict output.
- All SQL smoke tests pass or produce documented failures.
- RLS policies block non-members and unauthorized mutation.
- Storage policies keep private buckets private.
- Approved snapshots, credit ledgers, job events, and audit events are append-only/immutable as designed.

## B. Staging Validation Path

Human approval is required before staging validation.

Before staging:

- Confirm the Supabase project is `reeditpro`.
- Confirm no production user data is present.
- Create a backup/rollback plan.
- Review the full migration diff and known conflicts.
- Resolve Prompt 2A schema blockers or explicitly document why staging should proceed.
- Assign a migration owner and reviewer.

Staging checklist:

- Run a migration dry-run/review where supported.
- Apply migrations only after backup approval.
- Run all SQL smoke tests.
- Run Supabase advisor and save output.
- Verify RLS with owner, member, editor, non-member, and service-role cases.
- Verify storage buckets are private and path parsing is correct.
- Verify no signed URLs, secrets, provider keys, or service-role keys are stored in rows.
- Verify rollback plan remains viable after the migration.

## C. Production Validation Path

Production validation is not allowed in Prompt 2.

Production requires:

- Separate written approval.
- Current backup and tested restore path.
- Rollback plan.
- Maintenance window or deploy plan.
- Monitoring and alert owner.
- Migration owner.
- Test evidence from local and staging.
- Supabase advisor output.
- RLS/storage verification evidence.
- Security review for service-role boundary and secret handling.

## D. Validation Checklist

- Migration files run in timestamp order.
- Extension creation is idempotent.
- Duplicate table names are resolved or intentionally guarded.
- Duplicate function names use safe `create or replace` semantics where appropriate.
- Enum creation conflicts are resolved.
- FK references target canonical tables.
- Indexes exist for workspace/project, status, job, credit, snapshot, storage, and event lookups.
- RLS is enabled on user-visible tables.
- Service-role-only tables do not expose mutation to normal users.
- Storage buckets are private by default.
- Storage object policies use the canonical workspace/project path format.
- Helper functions compile and enforce intended gates.
- Credit ledger and audit records are append-only.
- Approved snapshots are immutable.
- Credit reservation gate blocks expensive work without approval/reservation.
- Job claim gate blocks duplicate active claims.
- No secrets are stored in database rows.
- No signed URLs are stored as source of truth.
