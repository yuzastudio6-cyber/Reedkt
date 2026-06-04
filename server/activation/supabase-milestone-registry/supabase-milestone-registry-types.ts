export type SupabaseMilestoneRegistryStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type SupabaseMilestoneRegistryMode = 'supabase_activation_milestone_registry'
export type SupabaseMigrationApplyStatus =
  | 'not_requested'
  | 'not_required_schema_present'
  | 'applied'
  | 'blocked_missing_db_url'
  | 'blocked_missing_confirmation'
  | 'blocked_psql_failed'
  | 'blocked_schema_missing'
export type SupabaseWriteVerificationStatus = 'not_attempted' | 'completed' | 'blocked'
export type Phase51CReadiness = 'ready_for_historical_activation_evidence_backfill' | 'blocked'

export type SupabaseMilestoneRegistryQaGateId =
  | 'phase51a_evidence'
  | 'schema_metadata'
  | 'migration_safety'
  | 'rls_security'
  | 'credential_safety'
  | 'writer_validation'
  | 'schema_verification'
  | 'milestone_bundle'
  | 'supabase_write_verification'
  | 'backfill_plan'
  | 'artifact_privacy'
  | 'blocked_features'

export interface SupabaseMilestoneRegistryConfig {
  phase: '51B'
  mode: SupabaseMilestoneRegistryMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-supabase/phase51b'
  baseBranch: 'codex/rp-activation-51a-supabase-data-plane-audit'
  migrationFile: 'supabase/migrations/202606040001_activation_milestone_registry.sql'
}

export interface SupabaseMilestoneRegistrySafetyFlags {
  activationRegistryWritesAllowed: boolean
  migrationApplyAllowed: boolean
  destructiveMigrationAllowed: false
  supabaseLifecycleAllowed: false
  sqlMutationOutsideMigrationAllowed: false
  serviceRoleFrontendExposureAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptExecutionAllowed: false
  broadHistoricalBackfillAllowed: false
  providerCallsAllowed: false
  mediaProcessingAllowed: false
  dockerAllowed: false
  deploymentAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface SupabaseRegistryTableMetadata {
  tableName: SupabaseRegistryTableName
  purpose: string
  naturalKey: string[]
  rlsRequired: true
  serviceRoleOnly: true
  columns: Array<{ name: string; type: string; required: boolean; purpose: string }>
}

export type SupabaseRegistryTableName =
  | 'activation_runs'
  | 'activation_artifacts'
  | 'activation_qa_gates'
  | 'readiness_snapshots'
  | 'tool_capabilities'
  | 'feature_gates'

export interface SupabaseRegistrySchemaMetadata {
  schemaVersion: 'phase51b_activation_milestone_registry_v1'
  migrationFile: string
  tables: SupabaseRegistryTableMetadata[]
  rlsEnabledRequired: true
  publicAccessRevokedRequired: true
  anonAccessRevokedRequired: true
  authenticatedAccessRevokedRequired: true
  serviceRoleOnlyRequired: true
  destructiveChangesAllowed: false
}

export interface SupabaseRegistryTableVerification {
  tableName: SupabaseRegistryTableName
  exists: boolean
  readCountStatus: 'not_attempted' | 'counted' | 'blocked'
  count: number | null
  blocker?: string
}

export interface SupabaseRegistrySchemaVerification {
  status: 'not_attempted' | 'completed' | 'blocked'
  tables: SupabaseRegistryTableVerification[]
  allTablesPresent: boolean
  serviceRoleRestUsed: boolean
  ddlUsedThroughRest: false
  blockers: string[]
  warnings: string[]
}

export interface SupabaseRegistryMigrationSummary {
  migrationFile: string
  applyRequested: boolean
  applyConfirmationPresent: boolean
  dbUrlResolved: boolean
  dbUrlSource: 'backend_env' | 'google_secret_manager' | 'unavailable'
  status: SupabaseMigrationApplyStatus
  psqlAvailable: boolean
  destructiveStatementsDetected: boolean
  ddlViaSupabaseRestAttempted: false
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneArtifactInput {
  artifactId: string
  artifactType: string
  gcsUri: string
  sourceOfTruth: boolean
  signedUrlSourceOfTruth: false
  metadata?: Record<string, unknown>
}

export interface SupabaseMilestoneQaGateInput {
  gateId: string
  status: 'passed' | 'blocked' | 'warning'
  summary: string
  mandatory: boolean
  evidence?: Record<string, unknown>
}

export interface SupabaseReadinessSnapshotInput {
  subsystem: string
  readinessKey: string
  readinessStatus: string
  scope: string
  evidence: Record<string, unknown>
}

export interface SupabaseToolCapabilityInput {
  toolId: string
  displayName: string
  track: string
  subsystem: string
  readinessState: string
  runtimeAllowed: boolean
  productionAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  evidence: Record<string, unknown>
}

export interface SupabaseFeatureGateInput {
  gateKey: string
  gateName: string
  gateStatus: 'disabled' | 'blocked' | 'readiness_only'
  enabled: false
  productionAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
  evidence: Record<string, unknown>
}

export interface SupabaseMilestoneBundle {
  phaseId: string
  phaseName: string
  runId: string
  status: SupabaseMilestoneRegistryStatus
  track: string
  subsystem: string
  branch: string
  prNumber: number | null
  prUrl: string | null
  baseBranch: string
  commitSha: string | null
  qaStatus: 'passed' | 'blocked' | 'warning'
  readinessStatus: string
  completedAt: string | null
  artifacts: SupabaseMilestoneArtifactInput[]
  qaGates: SupabaseMilestoneQaGateInput[]
  readinessSnapshots: SupabaseReadinessSnapshotInput[]
  toolCapabilities: SupabaseToolCapabilityInput[]
  featureGateUpdates: SupabaseFeatureGateInput[]
  summary: string
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneBundleValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneWriteVerification {
  status: SupabaseWriteVerificationStatus
  schemaPresent: boolean
  migrationApplied: boolean
  bundleValidated: boolean
  activationRunWritten: boolean
  artifactRowsWritten: number
  qaGateRowsWritten: number
  readinessRowsWritten: number
  toolCapabilityRowsWritten: number
  featureGateRowsWritten: number
  readbackMatched: boolean
  publicArtifactRejected: boolean
  signedUrlRejected: boolean
  secretLookingValueRejected: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneBackfillCandidate {
  phaseId: string
  phaseName: string
  canonicalRunId: string
  readinessValue: string
  source: 'committed_docs' | 'private_gcs_evidence'
  status: 'future_scoped_phase51c'
}

export interface SupabaseMilestoneBackfillPlan {
  status: 'planned'
  broadHistoricalBackfillAllowed: false
  phase51BBackfillExecution: false
  candidates: SupabaseMilestoneBackfillCandidate[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneRegistryQaGate {
  gateId: SupabaseMilestoneRegistryQaGateId
  passed: boolean
  mandatory: boolean
  summary: string
}

export interface SupabaseMilestoneRegistryQaSummary {
  status: 'passed' | 'blocked'
  gates: SupabaseMilestoneRegistryQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneRegistryArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SupabaseMilestoneRegistryCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_supabase_registry_write'
  migrationApplyMode: 'guarded_local_psql_only'
  allowedCommands: string[]
  blockedAlways: string[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneRegistryIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    condition: string
    mutationAllowedByDefault: false
  }>
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_DB_URL' | 'DATABASE_URL'
    access: 'metadata_or_backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  databasePlan: {
    migrationRequiresDirectDbUrl: true
    ddlThroughSupabaseRestAllowed: false
    broadDbPrivilegesAllowed: false
  }
  blockedRoles: string[]
}

export interface SupabaseMilestoneRegistryExecutionReport {
  ok: boolean
  phase: '51B'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  mode: SupabaseMilestoneRegistryMode
  schemaMetadata: SupabaseRegistrySchemaMetadata
  schemaVerification: SupabaseRegistrySchemaVerification
  migrationSummary: SupabaseRegistryMigrationSummary
  milestoneBundle: SupabaseMilestoneBundle
  backfillPlan: SupabaseMilestoneBackfillPlan
  commandPlan: SupabaseMilestoneRegistryCommandPlan
  iamPlan: SupabaseMilestoneRegistryIamPlan
  qa: SupabaseMilestoneRegistryQaSummary
  writeVerification: SupabaseMilestoneWriteVerification
  artifacts: SupabaseMilestoneRegistryArtifact[]
  safetyFlags: SupabaseMilestoneRegistrySafetyFlags
  phase51CReadiness: Phase51CReadiness
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneRegistryReport {
  reportId: 'activation-phase-51b-supabase-milestone-registry'
  createdAt: string
  phase: '51B'
  status: SupabaseMilestoneRegistryStatus
  config: SupabaseMilestoneRegistryConfig
  executionReport?: SupabaseMilestoneRegistryExecutionReport
  schemaMetadata: SupabaseRegistrySchemaMetadata
  schemaVerification: SupabaseRegistrySchemaVerification
  migrationSummary: SupabaseRegistryMigrationSummary
  milestoneBundle: SupabaseMilestoneBundle
  backfillPlan: SupabaseMilestoneBackfillPlan
  commandPlan: SupabaseMilestoneRegistryCommandPlan
  iamPlan: SupabaseMilestoneRegistryIamPlan
  qa: SupabaseMilestoneRegistryQaSummary
  writeVerification: SupabaseMilestoneWriteVerification
  safetyFlags: SupabaseMilestoneRegistrySafetyFlags
  phase51CReadiness: Phase51CReadiness
  blockers: string[]
  warnings: string[]
}
