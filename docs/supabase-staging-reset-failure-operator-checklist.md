# Supabase Staging Reset Failure Operator Checklist

Before any future recovery execution:

- Review safe PR #259 reset failure evidence and any redacted Supabase CLI/platform logs.
- Confirm whether staging was partially reset, left unchanged, or left in an intermediate migration-history state.
- Confirm backup/export artifact sufficiency and restore scope before considering a restore-based path.
- Choose exactly one future recovery strategy and approve it in a separate execution prompt.
- Keep Track B backfill writes blocked until migration history and registry schema/RLS verification pass.
- Use the latest read-only classifier `unchanged_failed_state` to select the next phase.
- Do not retry reset unless a separate approval packet proves the failure cause is safely fixed and backup/restore sufficiency is still acceptable.

Current blockers:

- `staging_reset_failed`
- `staging_sql_may_have_run`
- `reset_failure_cause_not_proven`
- `staging_post_reset_migration_history_verify_failed`
- `registry_migration_not_applied`
- `staging_post_reset_schema_rls_verify_failed`
- `registry_schema_absent_after_failed_reset`
- `manual_operator_review_required`
- `future_recovery_execution_approval_required`
