# Supabase Staging Reset And Reapply Execution Prompt

Use this prompt only after the staging data-impact and backup/snapshot approval decision is `approved_for_future_staging_reset_and_reapply_migrations`.

Current decision: `blocked_pending_staging_data_impact_review`

Execution remains blocked unless all are true:
- staging data impact is reviewed;
- backup/snapshot/export plan is approved and executed first;
- staging owner data-loss acceptance is committed as safe metadata;
- target proof confirms staging only;
- reset/reapply uses an approved Supabase workflow;
- post-reset schema, RLS, migration history, and registry checks are run;
- Track B staging backfill remains a separate follow-up after schema verification.

Do not run production Supabase, direct ad-hoc SQL, migration repair, Track B backfill writes, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks. Secrets must remain process-only and redacted.

This packet did not run staging reset, migration repair, schema deploy, direct DDL/DML, or Track B backfill.
