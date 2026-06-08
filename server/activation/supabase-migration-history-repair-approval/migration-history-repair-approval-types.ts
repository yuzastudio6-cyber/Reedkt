export type MigrationHistoryRepairDecision =
  | 'approved_for_future_staging_migration_history_repair'
  | 'blocked_pending_human_review'
  | 'blocked_pending_remote_history_evidence'
  | 'blocked_pending_local_migration_review'
  | 'rejected_due_unapproved_migration_history_risk'

export type MigrationHistoryRepairBlocker =
  | 'migration_history_repair_approval_packet_not_confirmed'
  | 'migration_history_evidence_missing'
  | 'migration_history_repair_candidate_not_deterministic'
  | 'remote_schema_equivalence_not_proven'
  | 'forbidden_confirmation_set'

export interface MigrationHistoryRepairEvidence {
  localMigrationIds: string[]
  remoteMigrationIds: string[]
  localIdsMissingRemotely: string[]
  olderLocalMigrationsAbsentRemotely: string[]
  remoteUnknownMigrationIds: string[]
  targetMigrationId: string
  targetMigrationFile: string
  targetMigrationPending: boolean
  targetMigrationRemoteApplied: boolean
  dryRunFailureReason: string
}
