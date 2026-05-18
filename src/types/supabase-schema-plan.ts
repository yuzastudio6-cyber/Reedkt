export type SupabaseSchemaGroup =
  | 'identity_workspace'
  | 'project_session_chat'
  | 'media_source'
  | 'intent_settings'
  | 'plan_version'
  | 'credit_approval'
  | 'generation_assets'
  | 'jobs_workers'
  | 'qa_revision_export'
  | 'audit_compliance'

export type SupabaseTableReadinessStatus =
  | 'planned'
  | 'ready_for_migration'
  | 'needs_review'
  | 'blocked'

export type SupabaseColumnType =
  | 'uuid'
  | 'text'
  | 'integer'
  | 'numeric'
  | 'boolean'
  | 'timestamp'
  | 'jsonb'
  | 'enum'
  | 'foreign_key'

export interface SupabaseColumnPlan {
  name: string
  type: SupabaseColumnType
  nullable: boolean
  defaultValue?: string
  references?: string
  indexed?: boolean
  unique?: boolean
  notes?: string[]
}

export interface SupabaseIndexPlan {
  name: string
  columns: string[]
  unique: boolean
  reason: string
}

export interface SupabaseRlsPolicyPlan {
  name: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  actor: 'owner' | 'workspace_member' | 'service_role' | 'system_worker'
  ruleSummary: string
  notes: string[]
}

export interface SupabaseTablePlan {
  name: string
  group: SupabaseSchemaGroup
  purpose: string
  readinessStatus: SupabaseTableReadinessStatus
  columns: SupabaseColumnPlan[]
  indexes: SupabaseIndexPlan[]
  rlsPolicies: SupabaseRlsPolicyPlan[]
  statusValues?: string[]
  jsonbFields: string[]
  relationships: string[]
  migrationNotes: string[]
}

export interface SupabaseStorageBucketPlan {
  name: string
  purpose: string
  isPublic: boolean
  userReadable: boolean
  workerWritable: boolean
  signedUrlRecommended: boolean
  retentionNotes: string[]
  rlsNotes: string[]
}

export interface SupabaseSchemaPlan {
  id: string
  summary: string
  tables: SupabaseTablePlan[]
  storageBuckets: SupabaseStorageBucketPlan[]
  migrationReadinessStatus: SupabaseTableReadinessStatus
  requiredReviews: string[]
  nonGoals: string[]
  nextMigrationMilestones: string[]
}
