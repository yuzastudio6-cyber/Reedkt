# Supabase Staging Reset Retry Operator Checklist

- unchanged_failed_state_reviewed: `true`
- backup_export_reviewed: `true`
- owner_data_loss_acceptance_reviewed: `true`
- retry_command_reviewed: `true`
- production_excluded: `true`
- track_b_backfill_separate: `true`
- secrets_redacted: `true`
- post_retry_verification_required: `true`
- rollback_escalation_reviewed: `true`
- manual_operator_approval_confirmed: `true`

Future execution must remain staging-only, use the fixed command shape, rerun or verify the private backup/export, and verify migration history plus registry schema/RLS before any Track B backfill phase.
