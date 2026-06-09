# Supabase Staging Reset Post Verification

After a successful guarded reset/reapply, verification must confirm:

- Supabase migration history includes every local migration.
- The activation milestone registry migration `202606050001_activation_milestone_registry_schema_rls.sql` is applied.
- All 11 registry tables exist.
- RLS is enabled for the registry tables.
- Public, anon, and authenticated grants remain revoked for the registry tables.
- Track B backfill preflight and diff are refreshed without write confirmations.

Verification is read-only metadata/catalog inspection. It must not run direct DDL/DML, migration repair, Track B writes, production SQL, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks.
