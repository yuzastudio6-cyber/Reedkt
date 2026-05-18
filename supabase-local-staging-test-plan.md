# Supabase Local And Staging Test Plan

## Local Testing Checklist

These commands are for a developer to run later. Codex must not run them in this milestone.

- `supabase start`
- `supabase db reset`
- `supabase migration list`
- `supabase status`
- Run the manual SQL smoke tests in `database/test-sql/`.
- Inspect RLS policies for workspace/project scoping.
- Inspect storage buckets and storage object policies.
- Generate database types later if desired.

Local tests should verify that approved snapshots, audit records, and credit ledger records cannot be mutated by normal users.

## Staging Checklist

- Create or link the staging Supabase project.
- Push migrations to staging only after local testing passes.
- Test auth users across two workspaces.
- Test user A/user B project isolation.
- Test storage policies with project-scoped object paths.
- Test approved snapshot immutability.
- Test audit event append-only behavior.
- Test credit ledger append-only behavior.
- Run Supabase Security Advisor.
- Run Supabase Performance Advisor.
- Verify no public source media access.
- Verify service-role operations are backend-only and audited.

## Production Checklist

- Backup/PITR decision is complete.
- Security Advisor is clean or exceptions are documented.
- Performance Advisor is reviewed.
- RLS behavior is verified with realistic workspace roles.
- Storage behavior is verified with signed URL flow.
- Manual SQL smoke tests passed in local and staging.
- Worker service-role handling is reviewed.
- No secrets are in frontend code.
- Production migration push is approved.

Production remains blocked until all checklist items are complete.
