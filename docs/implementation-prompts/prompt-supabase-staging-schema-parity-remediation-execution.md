# Supabase Staging Schema Parity Remediation Execution Prompt

Use this only in a separate approved execution phase.

Decision from strategy packet: `blocked_pending_staging_reset_approval`
Recommended strategy: `staging_reset_and_reapply_migrations`

Rules:
- execute only the separately approved strategy
- staging only
- no production
- no Track B backfill in the same phase unless separately approved later
- no migration-history repair-only path
- no secrets printed or committed
- dry-run first
- verify all PR #241 missing effects after remediation
- rerun PR #223 deploy transport or PR #198 backfill only according to the approved follow-up scope

This packet did not run migration repair, schema deploy, direct SQL, Track B backfill, or production SQL.
