# Supabase Production-Test Readiness

## Purpose

The repository contains Supabase migration candidates, but the raw executable directory is currently blocked by incompatible parallel foundations. It must not be treated as production-test-ready until the baseline is reconciled.

The SQL files live in `supabase/migrations/`, but that location contains overlapping `20260513` and `20260518` table definitions plus later migrations that depend on both. See `docs/supabase-migration-baseline-reconciliation.md`. Codex does not apply these migrations, connect to Supabase, create a client, add secrets, or deploy anything in this milestone.

Baseline reconciliation must happen before local testing. Production deployment remains blocked until one canonical chain passes local reset, staging tests, RLS review, Supabase Security Advisor review, Supabase Performance Advisor review, backup/PITR decisions, and explicit approval.

## Environment Flow

1. Canonical migration-baseline reconciliation comes first.
2. Local Supabase testing comes second.
3. Staging Supabase testing comes third.
4. Production migration comes last.

Rules:

- Never directly edit the remote production schema through the Supabase dashboard or table editor.
- Do not run the raw `supabase/migrations/` directory while `npm run audit:supabase-migration-baseline` reports `blocked_by_parallel_foundations`.
- Review and commit migration files before running them.
- Run migrations locally before staging.
- Push to production only after local/staging tests pass and the migration is approved.
- Keep service-role credentials and provider secrets out of frontend code.

## Production Readiness Requirements

Before production, ReeditPro must confirm:

- The canonical migration chain completes a clean local reset from an empty database.
- RLS is enabled on all exposed public tables.
- Workspace/project membership policies are tested.
- Storage buckets remain private by default.
- Signed URL strategy is ready for source media, generated assets, previews, exports, thumbnails, and QA artifacts.
- Approved snapshot immutability is tested.
- Audit events are append-only.
- Credit ledger entries are append-only.
- Worker tables are protected from normal user writes.
- Common query and RLS indexes are reviewed.
- Supabase Security Advisor is reviewed.
- Supabase Performance Advisor is reviewed.
- Backup/PITR strategy is decided.
- SSL, network restrictions, MFA, and account security are reviewed.
- No service-role secret is exposed to frontend code.
- No provider secrets are exposed to frontend code.

## Non-Goals

This task does not:

- Run migrations.
- Connect Supabase.
- Deploy production.
- Create backend workers.
- Implement billing.
- Execute tools.
- Create a Supabase client.
- Add environment variables or secrets.
