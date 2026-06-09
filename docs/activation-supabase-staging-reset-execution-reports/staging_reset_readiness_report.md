# Supabase Staging Reset/Reapply Execution Readiness

- Status: `blocked`
- Staging reset run: `no`
- Production affected: `false`
- Track B backfill rows written: `false`
- Migration repair run: `false`
- Direct DDL/DML run: `false`
- Active blockers: `staging_reset_execute_not_confirmed, staging_db_reset_not_confirmed, staging_owner_data_loss_acceptance_not_confirmed, staging_backup_snapshot_packet_not_confirmed, staging_schema_mutation_not_confirmed, staging_reset_failed, staging_post_reset_migration_history_verify_failed, staging_post_reset_schema_rls_verify_failed`
- Next recommended phase: Resolve the exact staging reset backup, secret, CLI, reset, or post-reset verification blocker before Track B backfill.
