# Prompt: Supabase Staging Reset Recovery Execution

Use this prompt only after the reset failure triage packet is reviewed and a human/operator approves one exact recovery strategy.

Current triage decision: `recovery_path_manual_operator_review_required`.
Current read-only inspection status: `passed`.
Current post-failure state classifier: `unchanged_failed_state`.

Remaining evidence gaps:

- `staging_reset_failed`
- `staging_sql_may_have_run`
- `reset_failure_cause_not_proven`
- `staging_post_reset_migration_history_verify_failed`
- `registry_migration_not_applied`
- `staging_post_reset_schema_rls_verify_failed`
- `registry_schema_absent_after_failed_reset`
- `manual_operator_review_required`
- `future_recovery_execution_approval_required`

Do not run this prompt unless the future approval names the selected recovery path, confirms backup/restore sufficiency, proves the approved staging target, and defines post-recovery verification. Track B backfill remains a later separate phase after migration history and registry schema/RLS verification pass.

Forbidden unless separately approved: reset retry, schema deploy, migration repair, direct/manual SQL, Track B row writes, production Supabase, provider calls, route/tool/worker execution, media processing, Track A, beta, and production unlocks.
