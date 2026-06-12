import type {
  SupabaseFeatureGateInput,
  SupabaseMilestoneArtifactInput,
  SupabaseMilestoneBundle,
  SupabaseMilestoneQaGateInput,
  SupabaseMilestoneWriteVerification,
  SupabaseReadinessSnapshotInput,
  SupabaseRegistrySchemaVerification,
  SupabaseToolCapabilityInput,
} from '../supabase-milestone-registry'

export type SupabaseMilestoneSyncStatus = 'completed' | 'partial' | 'blocked' | 'skipped' | 'superseded'
export type SupabaseMilestoneSyncReportStatus = 'planned' | SupabaseMilestoneSyncStatus
export type SupabaseMilestoneSyncMode = 'automatic_per_phase_supabase_milestone_sync'
export type SupabaseMilestoneSyncPhase52AReadiness = 'ready_for_shared_agent_and_tool_ownership_architecture' | 'blocked'

export interface SupabaseMilestoneSyncPolicy {
  writesAllowed: boolean
  migrationsAllowed: false
  historicalBackfillAllowed: false
  productRowWritesAllowed: false
  providerCallsAllowed: false
  frontendServiceRoleExposureAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptExecutionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface ActivationMilestoneSyncInput {
  phaseId: string
  phaseName: string
  runId: string
  status: SupabaseMilestoneSyncStatus
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
  reportArtifactPath: string
  manifestArtifactPath: string | null
  qaArtifactPath: string
  artifacts: SupabaseMilestoneArtifactInput[]
  qaGates: SupabaseMilestoneQaGateInput[]
  readinessSnapshots: SupabaseReadinessSnapshotInput[]
  toolCapabilities: SupabaseToolCapabilityInput[]
  featureGateUpdates: SupabaseFeatureGateInput[]
  summary: string
  blockers: string[]
  warnings: string[]
  supabaseSyncPolicy: SupabaseMilestoneSyncPolicy
}

export interface ActivationMilestoneSyncValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

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
  branch: 'codex/rp-activation-51d-automatic-supabase-milestone-sync'
}

export interface SupabaseMilestoneSyncCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_single_self_sync_write'
  allowedCommands: string[]
  blockedAlways: string[]
  noMigrationCommands: true
  noBackfillRerun: true
  blockers: string[]
  warnings: string[]
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
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    migrationsAllowed: false
    historicalBackfillAllowed: false
  }
  blockedRoles: string[]
}

export interface SupabaseMilestoneSyncQaGate {
  gateId:
    | 'phase51c_evidence'
    | 'sync_contract'
    | 'report_adapter'
    | 'sanitizer_policy'
    | 'registry_schema_available'
    | 'single_self_sync_write'
    | 'readback_verification'
    | 'artifact_policy'
    | 'feature_gate_policy'
    | 'secret_safety'
    | 'blocked_features'
  passed: boolean
  mandatory: boolean
  summary: string
}

export interface SupabaseMilestoneSyncQaSummary {
  status: 'passed' | 'blocked'
  gates: SupabaseMilestoneSyncQaGate[]
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

export interface SupabaseMilestoneSyncResult {
  status: 'completed' | 'blocked'
  inputValidated: boolean
  bundleValidated: boolean
  schemaPresent: boolean
  writeVerification: SupabaseMilestoneWriteVerification
  readbackMatched: boolean
  writesLimitedToMilestoneRegistry: true
  migrationsApplied: false
  historicalBackfillRerun: false
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
  schemaVerification: SupabaseRegistrySchemaVerification
  syncResult: SupabaseMilestoneSyncResult
  commandPlan: SupabaseMilestoneSyncCommandPlan
  iamPlan: SupabaseMilestoneSyncIamPlan
  qa: SupabaseMilestoneSyncQaSummary
  artifacts: SupabaseMilestoneSyncArtifact[]
  safetyFlags: SupabaseMilestoneSyncPolicy
  phase52AReadiness: SupabaseMilestoneSyncPhase52AReadiness
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
  schemaVerification: SupabaseRegistrySchemaVerification
  syncResult: SupabaseMilestoneSyncResult
  commandPlan: SupabaseMilestoneSyncCommandPlan
  iamPlan: SupabaseMilestoneSyncIamPlan
  qa: SupabaseMilestoneSyncQaSummary
  safetyFlags: SupabaseMilestoneSyncPolicy
  phase52AReadiness: SupabaseMilestoneSyncPhase52AReadiness
  blockers: string[]
  warnings: string[]
}
