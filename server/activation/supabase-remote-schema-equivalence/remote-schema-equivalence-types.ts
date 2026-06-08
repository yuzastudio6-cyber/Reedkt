export type RemoteSchemaEquivalenceDecision =
  | 'approved_for_future_staging_migration_history_repair'
  | 'blocked_pending_remote_history_evidence'
  | 'blocked_pending_local_migration_review'

export type RemoteSchemaEquivalenceOverall =
  | 'all_equivalent'
  | 'partial_equivalence'
  | 'not_equivalent'
  | 'insufficient_evidence'

export type RemoteSchemaEquivalenceBlocker =
  | 'remote_schema_equivalence_review_not_executed'
  | 'remote_schema_equivalence_review_not_confirmed'
  | 'staging_schema_readonly_inspection_not_confirmed'
  | 'staging_migration_history_audit_not_confirmed'
  | 'staging_db_url_unavailable_for_readonly_introspection'
  | 'staging_db_url_target_ref_missing'
  | 'staging_db_url_target_ref_mismatch'
  | 'staging_db_url_unparseable'
  | 'psql_unavailable_for_readonly_introspection'
  | 'remote_schema_introspection_failed'
  | 'migration_intent_unparsed'
  | 'remote_schema_equivalence_not_proven'
  | 'forbidden_confirmation_set'

export interface ParsedMigrationIntent {
  version: string
  migrationFile: string
  status: 'parsed' | 'migration_intent_unparsed' | 'missing_file'
  schemaOnly: boolean
  changesData: boolean
  destructiveStatements: string[]
  policyReplacementStatements: number
  affectedTables: string[]
  expectedColumns: Array<{ schema: string; table: string; column: string }>
  expectedFunctions: Array<{ schema: string; name: string }>
  expectedTypes: Array<{ schema: string; name: string }>
  expectedIndexes: string[]
  expectedTriggers: string[]
  expectedRlsTables: Array<{ schema: string; table: string }>
  expectedPolicies: Array<{ schema: string; table: string; name: string }>
  expectedExtensions: string[]
  expectedStorageBuckets: string[]
  confidence: 'high' | 'medium' | 'low'
  blockers: RemoteSchemaEquivalenceBlocker[]
}
