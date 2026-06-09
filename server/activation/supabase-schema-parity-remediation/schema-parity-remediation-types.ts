export type SchemaParityRemediationDecision =
  | 'approved_for_future_staging_schema_parity_remediation_migration'
  | 'approved_for_future_ordered_missing_migration_apply'
  | 'blocked_pending_human_review'
  | 'blocked_pending_drift_analysis'
  | 'blocked_pending_staging_reset_approval'
  | 'rejected_due_unacceptable_schema_drift_risk'

export type SchemaParityRemediationBlocker =
  | 'schema_parity_evidence_missing'
  | 'remote_schema_equivalence_not_proven'
  | 'missing_effects_include_data_changing_migrations'
  | 'missing_effects_include_rls_or_storage_policy_changes'
  | 'migration_history_repair_only_rejected'
  | 'ordered_missing_migration_apply_not_approved'
  | 'idempotent_remediation_migration_not_approved'
  | 'staging_reset_approval_required'
  | 'forbidden_confirmation_set'

export type SchemaParityRiskLevel = 'low' | 'medium' | 'high'

export type SchemaParityRemediationOptionId =
  | 'ordered_missing_migration_apply'
  | 'idempotent_schema_parity_remediation_migration'
  | 'staging_reset_and_reapply_migrations'
  | 'migration_history_repair_only'
  | 'do_nothing'

export type SchemaParityRemediationOptionStatus =
  | 'recommended_next_approval_path'
  | 'not_approved_pending_human_review'
  | 'rejected'

export interface SchemaParityMissingEffect {
  migrationVersion: string
  migrationFile: string
  equivalence: false
  expectedObjectCount: number
  observedObjectCount: number
  missingObjectCount: number
  missingObjectSamples: string[]
  affectedSchemaObjects: string[]
  affectedTables: string[]
  expectedStorageBuckets: string[]
  expectedPolicyCount: number
  expectedRlsTableCount: number
  destructiveStatementCount: number
  policyReplacementStatementCount: number
  schemaOnly: boolean
  changesData: boolean
  riskLevel: SchemaParityRiskLevel
  confidence: 'high' | 'medium' | 'low'
  recommendedRemediationOption: string
  blockers: SchemaParityRemediationBlocker[]
}
