# Supabase Production-Test Readiness

## Purpose

This milestone creates production-test-ready Supabase migration files for ReeditPro, but it does not run them.

The active migration files now live in `supabase/migrations/` so they can be reviewed and tested with the Supabase CLI in a later manual step. Codex does not apply these migrations, connect to Supabase, create a client, add secrets, or deploy anything in this milestone.

Local and staging testing must happen manually before production. Production deployment remains blocked until local tests, staging tests, RLS review, Supabase Security Advisor review, Supabase Performance Advisor review, backup/PITR decisions, and explicit approval are complete.

## Environment Flow

1. Local Supabase testing comes first.
2. Staging Supabase testing comes second.
3. Production migration comes last.

Rules:

- Never directly edit the remote production schema through the Supabase dashboard or table editor.
- Review and commit migration files before running them.
- Run migrations locally before staging.
- Push to production only after local/staging tests pass and the migration is approved.
- Keep service-role credentials and provider secrets out of frontend code.

## Production Readiness Requirements

Before production, ReeditPro must confirm:

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
