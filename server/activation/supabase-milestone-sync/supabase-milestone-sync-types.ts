import type {
  SupabaseFeatureGateInput,
  SupabaseMilestoneBundle,
  SupabaseMilestoneBundleValidation,
  SupabaseMilestoneQaGateInput,
  SupabaseMilestoneWriteVerification,
  SupabaseReadinessSnapshotInput,
  SupabaseRegistrySchemaVerification,
  SupabaseToolCapabilityInput,
} from '../supabase-milestone-registry'

export type ActivationMilestoneSyncStatus = 'completed' | 'partial' | 'blocked' | 'skipped' | 'superseded'
export type SupabaseMilestoneSyncReportStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type SupabaseMilestoneSyncMode = 'automatic_per_phase_supabase_milestone_sync'
export type Phase52AReadiness = 'ready_for_shared_agent_and_tool_ownership_architecture' | 'blocked'

export interface SupabaseMilestoneSyncConfig {
  phase: '51D'
  mode: SupabaseMilestoneSyncMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-supabase/phase51d'
  baseBranch: 'codex/rp-activation-51c-historical-activation-evidence-backfill'
}

export interface SupabaseMilestoneSyncSafetyFlags {
  supabaseWritesAllowed: boolean
  milestoneRegistryOnly: true
  migrationApplyAllowed: false
  schemaMutationAllowed: false
  rlsMutationAllowed: false
  historicalBackfillAllowed: false
  secretValueLoggingAllowed: false
  frontendServiceRoleAllowed: false
  rawPromptExecutionAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  publicUrlSourceOfTruthAllowed: false
  rawProviderResponseStorageAllowed: false
  largeArtifactBlobStorageAllowed: false
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
  broadMediaAllowed: false
}

export interface SupabaseMilestoneSyncPolicy {
  mode: SupabaseMilestoneSyncMode
  registryTablesOnly: true
  privateGcsArtifactReferencesOnly: true
  supabaseStoresBlobs: false
  futurePhasePrSummaryTemplate: string
}

export interface ActivationMilestoneSyncArtifactInput {
  artifactId: string
  artifactType: string
  gcsUri: string
  sourceOfTruth: boolean
  signedUrlSourceOfTruth: false
  metadata?: Record<string, unknown>
}

export interface ActivationMilestoneSyncInput {
  phaseId: string
  phaseName: string
  runId: string
  status: ActivationMilestoneSyncStatus
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
  reportPath: string | null
  manifestPath: string | null
  qaPath: string | null
  artifacts: ActivationMilestoneSyncArtifactInput[]
  qaGates: SupabaseMilestoneQaGateInput[]
  readinessSnapshots: SupabaseReadinessSnapshotInput[]
  toolCapabilities: SupabaseToolCapabilityInput[]
  featureGateUpdates: SupabaseFeatureGateInput[]
  summary: string
  blockers: string[]
  warnings: string[]
  supabaseSyncPolicy: SupabaseMilestoneSyncPolicy
}

export interface ActivationReportMilestoneAdapterResult {
  input: ActivationMilestoneSyncInput
  warnings: string[]
}

export interface ActivationMilestoneSanitizerResult {
  ok: boolean
  blockers: string[]
  warnings: string[]
  checkedPaths: string[]
}

export interface ActivationMilestoneReadbackVerification {
  status: 'not_attempted' | 'completed' | 'blocked'
  phaseId: string
  runId: string
  readbackMatched: boolean
  activationRunId: string | null
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneSyncArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SupabaseMilestoneSyncCommandPlan {
  defaultMode: 'static_report_only'
  executeCommand: string
  applyMigrations: false
  historicalBackfill: false
  writes: 'phase51d_self_sync_only'
  blockedCommands: string[]
}

export interface SupabaseMilestoneSyncIamPlan {
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
    historicalBackfillAllowed: false
  }
  blockedRoles: string[]
}

export type SupabaseMilestoneSyncQaGateId =
  | 'phase51c_evidence'
  | 'registry_schema_available'
  | 'sync_contract_defined'
  | 'report_adapter'
  | 'sanitizer_policy'
  | 'idempotent_sync'
  | 'self_sync_write'
  | 'readback_verification'
  | 'feature_gate_policy'
  | 'future_phase_contract'
  | 'artifact_privacy'
  | 'blocked_features'

export interface SupabaseMilestoneSyncQaGate {
  gateId: SupabaseMilestoneSyncQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface SupabaseMilestoneSyncQaSummary {
  status: 'passed' | 'blocked'
  gates: SupabaseMilestoneSyncQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneSyncExecutionReport {
  ok: boolean
  phase: '51D'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  mode: SupabaseMilestoneSyncMode
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  bundleValidation: SupabaseMilestoneBundleValidation
  sanitizer: ActivationMilestoneSanitizerResult
  schemaVerification: SupabaseRegistrySchemaVerification
  writeVerification: SupabaseMilestoneWriteVerification
  readbackVerification: ActivationMilestoneReadbackVerification
  commandPlan: SupabaseMilestoneSyncCommandPlan
  iamPlan: SupabaseMilestoneSyncIamPlan
  qa: SupabaseMilestoneSyncQaSummary
  artifacts: SupabaseMilestoneSyncArtifact[]
  safetyFlags: SupabaseMilestoneSyncSafetyFlags
  phase52AReadiness: Phase52AReadiness
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneSyncReport {
  reportId: 'activation-phase-51d-supabase-milestone-sync'
  createdAt: string
  phase: '51D'
  status: SupabaseMilestoneSyncReportStatus
  config: SupabaseMilestoneSyncConfig
  executionReport?: SupabaseMilestoneSyncExecutionReport
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  bundleValidation: SupabaseMilestoneBundleValidation
  sanitizer: ActivationMilestoneSanitizerResult
  schemaVerification: SupabaseRegistrySchemaVerification
  writeVerification: SupabaseMilestoneWriteVerification
  readbackVerification: ActivationMilestoneReadbackVerification
  commandPlan: SupabaseMilestoneSyncCommandPlan
  iamPlan: SupabaseMilestoneSyncIamPlan
  qa: SupabaseMilestoneSyncQaSummary
  safetyFlags: SupabaseMilestoneSyncSafetyFlags
  phase52AReadiness: Phase52AReadiness
  blockers: string[]
  warnings: string[]
}
