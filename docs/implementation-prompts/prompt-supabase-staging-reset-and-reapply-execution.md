# Supabase Staging Reset And Reapply Execution Prompt

Use this only in a separate approved execution phase.

Decision from approval packet: `blocked_pending_staging_data_impact_review`

Rules:
- run only if a later approval resolves data impact and backup/snapshot blockers
- staging only, never production
- backup/snapshot/export first when required
- migration-safe dry-run first
- reset/reapply only with approved target proof and redacted credentials
- verify schema, RLS, migration history, and activation milestone registry tables after reset
- rerun PR #198 Track B backfill only in a later separate phase
- do not print or commit secrets

This packet did not run staging reset, migration repair, schema deploy, direct SQL, or Track B backfill.
