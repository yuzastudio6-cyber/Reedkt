import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneBundleValidation,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'

export type SupabaseHistoricalBackfillStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type SupabaseHistoricalBackfillMode = 'supabase_historical_activation_evidence_backfill'
export type SupabaseHistoricalBackfillPriority = 'P0' | 'P1'
export type SupabaseHistoricalEvidenceVerificationStatus = 'local_doc_only' | 'canonical_gcs_verified' | 'missing' | 'skipped'
export type SupabaseHistoricalPhaseWriteStatus = 'not_attempted' | 'written' | 'skipped' | 'blocked'
export type Phase51DReadiness = 'ready_for_automatic_per_phase_supabase_milestone_sync' | 'blocked'

export interface SupabaseHistoricalBackfillConfig {
  phase: '51C'
  mode: SupabaseHistoricalBackfillMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-supabase/phase51c'
  baseBranch: 'codex/rp-activation-51b-supabase-activation-milestone-registry'
}

export interface SupabaseHistoricalBackfillSafetyFlags {
  supabaseWritesAllowed: boolean
  milestoneRegistryWritesOnly: true
  migrationApplyAllowed: false
  schemaMutationAllowed: false
  rlsMutationAllowed: false
  secretValueLoggingAllowed: false
  frontendServiceRoleAllowed: false
  rawPromptExecutionAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawProviderResponseStorageAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface SupabaseHistoricalBackfillPhaseDefinition {
  phaseId: string
  phaseName: string
  runId: string
  priority: SupabaseHistoricalBackfillPriority
  track: string
  subsystem: string
  branch: string
  baseBranch: string
  prNumber: number | null
  prUrl: string | null
  status: 'completed' | 'partial' | 'blocked'
  qaStatus: 'passed' | 'warning' | 'blocked'
  readinessStatus: string
  completedAt: string | null
  docsPath: string
  summary: string
  toolCapabilities: Array<{
    toolId: string
    displayName: string
    readinessState: string
    runtimeAllowed: boolean
  }>
}

export interface SupabaseHistoricalEvidenceRecord {
  phaseId: string
  phaseName: string
  runId: string
  priority: SupabaseHistoricalBackfillPriority
  docsPath: string
  docsPresent: boolean
  evidenceVerificationStatus: SupabaseHistoricalEvidenceVerificationStatus
  gcsUris: string[]
  generatedAssetUris: string[]
  qaArtifactUris: string[]
  readinessDecision: string
  skippedReason: string | null
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBackfillPlan {
  phase: '51C'
  mode: SupabaseHistoricalBackfillMode
  p0Phases: string[]
  p1OptionalPhases: string[]
  writesPerformedByDefault: false
  migrationsApplied: false
  schemaMutationAllowed: false
  broadBackfillAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBundleRecord {
  phase: SupabaseHistoricalBackfillPhaseDefinition
  evidence: SupabaseHistoricalEvidenceRecord
  bundle: SupabaseMilestoneBundle | null
  validation: SupabaseMilestoneBundleValidation | null
  writeVerification: SupabaseMilestoneWriteVerification | null
  writeStatus: SupabaseHistoricalPhaseWriteStatus
  readbackMatched: boolean
  skippedReason: string | null
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBackfillSummary {
  runId: string
  attemptedPhases: string[]
  writtenPhases: string[]
  skippedPhases: Array<{ phaseId: string; reason: string }>
  blockedPhases: Array<{ phaseId: string; blockers: string[] }>
  p0Written: string[]
  p0MissingOrBlocked: string[]
  p1Written: string[]
  writesPerformed: boolean
  migrationsApplied: false
  secretsPrinted: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}

export type SupabaseHistoricalBackfillQaGateId =
  | 'phase51b_evidence'
  | 'registry_schema_available'
  | 'backfill_plan_defined'
  | 'evidence_resolution'
  | 'bundle_validation'
  | 'idempotent_upsert'
  | 'readback_verification'
  | 'artifact_policy'
  | 'feature_gate_policy'
  | 'secret_safety'
  | 'skipped_phase_policy'
  | 'blocked_features'

export interface SupabaseHistoricalBackfillQaGate {
  gateId: SupabaseHistoricalBackfillQaGateId
  passed: boolean
  mandatory: boolean
  summary: string
}

export interface SupabaseHistoricalBackfillQaSummary {
  status: 'passed' | 'blocked'
  gates: SupabaseHistoricalBackfillQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBackfillCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_supabase_historical_backfill'
  allowedCommands: string[]
  blockedAlways: string[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBackfillIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    condition: string
    mutationAllowedByDefault: false
  }>
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only_during_confirmed_execution'
    mutationAllowedByDefault: false
  }>
  databasePlan: {
    writesAllowedOnlyToMilestoneRegistryTables: true
    migrationsAllowed: false
    schemaMutationAllowed: false
    rlsMutationAllowed: false
  }
  blockedRoles: string[]
}

export interface SupabaseHistoricalBackfillArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SupabaseHistoricalBackfillExecutionReport {
  ok: boolean
  phase: '51C'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  mode: SupabaseHistoricalBackfillMode
  plan: SupabaseHistoricalBackfillPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  evidence: SupabaseHistoricalEvidenceRecord[]
  bundleRecords: SupabaseHistoricalBundleRecord[]
  summary: SupabaseHistoricalBackfillSummary
  commandPlan: SupabaseHistoricalBackfillCommandPlan
  iamPlan: SupabaseHistoricalBackfillIamPlan
  qa: SupabaseHistoricalBackfillQaSummary
  artifacts: SupabaseHistoricalBackfillArtifact[]
  safetyFlags: SupabaseHistoricalBackfillSafetyFlags
  phase51DReadiness: Phase51DReadiness
  blockers: string[]
  warnings: string[]
}

export interface SupabaseHistoricalBackfillReport {
  reportId: 'activation-phase-51c-supabase-historical-backfill'
  createdAt: string
  phase: '51C'
  status: SupabaseHistoricalBackfillStatus
  config: SupabaseHistoricalBackfillConfig
  executionReport?: SupabaseHistoricalBackfillExecutionReport
  plan: SupabaseHistoricalBackfillPlan
  evidence: SupabaseHistoricalEvidenceRecord[]
  bundleRecords: SupabaseHistoricalBundleRecord[]
  summary: SupabaseHistoricalBackfillSummary
  commandPlan: SupabaseHistoricalBackfillCommandPlan
  iamPlan: SupabaseHistoricalBackfillIamPlan
  qa: SupabaseHistoricalBackfillQaSummary
  safetyFlags: SupabaseHistoricalBackfillSafetyFlags
  phase51DReadiness: Phase51DReadiness
  blockers: string[]
  warnings: string[]
}
