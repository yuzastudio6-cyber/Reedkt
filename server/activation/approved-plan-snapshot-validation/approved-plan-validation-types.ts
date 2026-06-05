import type {
  AgentToolPlanBridgeReport,
  AgentToolPlanOwnerRoute,
  BlockedPlanRecord,
  CandidateApprovedPlanSnapshot,
  CrossTrackHandoffPacket,
} from '../agent-tool-plan-bridge'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'

export type ApprovedPlanValidationStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type ApprovedPlanValidationExecutionStatus = 'completed' | 'partial' | 'blocked'
export type Phase52FReadiness = 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' | 'blocked'

export type ApprovedPlanValidationQaGateId =
  | 'source_of_truth_repo_audit'
  | 'phase52d_evidence'
  | 'candidate_plan_schema_validation'
  | 'blocked_plan_validation'
  | 'ownership_validation'
  | 'runtime_block_validation'
  | 'feature_gate_validation'
  | 'system_reconciliation'
  | 'missing_contract_inventory'
  | 'validated_handoffs'
  | 'source_of_truth_policy'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface ApprovedPlanValidationSafetyFlags extends SupabaseMilestoneSyncPolicy {
  repoAuditRequired: true
  candidatePlanValidationAllowed: true
  systemReconciliationAllowed: true
  privateGcsArtifactUploadAllowed: true
  supabaseMilestoneSyncAllowed: true
  supabaseWritesLimitedToPhase52E: true
  candidatePlanGenerationAllowed: false
  toolRuntimeAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  mapRenderingAllowed: false
  browserCaptureAllowed: false
  providerCallsAllowed: false
  approvedPlanSnapshotExecutionAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  migrationsAllowed: false
  schemaChangesAllowed: false
  historicalBackfillAllowed: false
}

export interface ApprovedPlanValidationConfig {
  phase: '52E'
  mode: 'approved_plan_snapshot_validation_system_reconciliation'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52DRunId: 'phase52d-20260605T164423'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-agents/phase52e'
  sourcePhase52DGeneratedPrefix: string
  sourcePhase52DQaPrefix: string
  branch: 'codex/rp-activation-52e-approved-plan-snapshot-validation-system-reconciliation'
  baseBranch: 'codex/rp-activation-52d-agent-to-tool-plan-bridge'
}

export interface ApprovedPlanSourceTruthFileAudit {
  path: string
  present: boolean
  owner: string
  role: 'required_source_of_truth' | 'optional_cross_chat' | 'agent_contract' | 'foundation_contract'
  impact: string
  severity: 'info' | 'warning' | 'blocker'
  followUp: string
  blockingForPhase52E: boolean
}

export interface ApprovedPlanRepoOwnershipAudit {
  auditId: 'phase52e_repo_ownership_audit'
  createdAt: string
  workstreamOwner: 'shared_agent_tool_coordination'
  relatedWorkstreams: string[]
  explicitlyNotOwned: string[]
  integrationPoints: string[]
  filesInspected: ApprovedPlanSourceTruthFileAudit[]
  missingExpectedFiles: string[]
  duplicateValidationDetected: false
  implementationAllowed: boolean
  findings: string[]
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanEvidenceContext {
  phase52D: {
    runId: 'phase52d-20260605T164423'
    status: 'completed'
    prNumber: 208
    commitSha: 'bf6883ac4b3287cf7e4b38098459b21ea34cdb19'
    reference: string
  }
  phase52DReportStatus: AgentToolPlanBridgeReport['status']
  evidenceSource: 'private_gcs_phase52d_artifacts' | 'committed_phase52d_reconstruction'
  sourceReport: AgentToolPlanBridgeReport
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  handoffPackets: CrossTrackHandoffPacket[]
  contextFlags: {
    expectedCandidatePlans: 7
    expectedBlockedPlans: 4
    expectedHandoffPackets: 7
    trackAInternalTestingReady: boolean
    webSearchInternalBetaCandidateReady: boolean
    mapGeospatialInternalTestingReady: boolean
    supabaseMilestoneSyncReady: boolean
    aiToolsPlaceholdersPending: boolean
    trackBVlmExcluded: boolean
    trackBDemucsBlockedPendingProvenance: boolean
    workerExecutionNotOwnedHere: true
    productionExternalBetaBroadMediaBlocked: true
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanValidationResult {
  validationId: string
  status: 'passed' | 'blocked'
  checkedRecords: number
  blockers: string[]
  warnings: string[]
  details: Array<{ id: string; passed: boolean; summary: string }>
}

export interface OwnershipValidationResult extends ApprovedPlanValidationResult {
  ownerRoutes: Array<{
    planId: string
    ownerRoute: AgentToolPlanOwnerRoute
    ownerValid: boolean
    nextOwnerAction: string
  }>
}

export interface RuntimeBlockValidationResult extends ApprovedPlanValidationResult {
  runtimeExecutionAllowed: false
  workerExecutionAllowed: false
  providerCallsAllowed: false
  directAgentToolExecutionAllowed: false
}

export interface FeatureGateValidationResult extends ApprovedPlanValidationResult {
  disabledGates: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
}

export interface SystemReconciliationSummary {
  reconciliationId: 'phase52e_system_reconciliation'
  readyControlledInternalPlanning: string[]
  readyInternalTestingButNotExecutionHere: string[]
  handoffRequired: string[]
  blockedScopes: string[]
  sourceOfTruthSummary: string[]
  phase52FRecommendedScope: string
  blockers: string[]
  warnings: string[]
}

export interface MissingContractInventory {
  inventoryId: 'phase52e_missing_contract_inventory'
  missingContracts: ApprovedPlanSourceTruthFileAudit[]
  blockingMissingContracts: ApprovedPlanSourceTruthFileAudit[]
  warnings: string[]
  blockers: string[]
}

export interface ValidatedHandoffPacket {
  packetId: string
  owner: string
  candidatePlanIds: string[]
  blockedPlanIds: string[]
  validationResult: 'validated' | 'blocked'
  nextAction: string
  prohibitedActions: string[]
  supabaseRefs: string[]
  risk: 'low' | 'medium' | 'high'
  requiredPromptOwner: string
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanValidationManifest {
  manifestId: 'phase52e_approved_plan_snapshot_validation_manifest'
  runId: string
  phase: '52E'
  repoOwnershipAudit: ApprovedPlanRepoOwnershipAudit
  evidenceContextSummary: {
    evidenceSource: ApprovedPlanEvidenceContext['evidenceSource']
    candidatePlanCount: number
    blockedPlanCount: number
    handoffPacketCount: number
    phase52DRunId: string
  }
  validatedCandidatePlanIds: string[]
  validatedBlockedPlanIds: string[]
  featureGateValidation: FeatureGateValidationResult
  runtimeBlockValidation: RuntimeBlockValidationResult
  ownershipValidation: OwnershipValidationResult
  systemReconciliation: SystemReconciliationSummary
  missingContractInventory: MissingContractInventory
  validatedHandoffIds: string[]
  sourceOfTruthSummary: string[]
  supabaseMilestoneSyncStatus: 'not_attempted' | 'completed' | 'blocked'
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase52FReadiness: Phase52FReadiness
}

export interface ApprovedPlanValidationQaGate {
  gateId: ApprovedPlanValidationQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface ApprovedPlanValidationQaSummary {
  status: 'passed' | 'blocked'
  gates: ApprovedPlanValidationQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanValidationArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ApprovedPlanValidationSupabaseSyncResult {
  status: 'not_attempted' | 'completed' | 'blocked'
  schemaPresent: boolean
  inputValidated: boolean
  bundleValidated: boolean
  milestoneWrite: SupabaseMilestoneWriteVerification
  activationRunReadback: boolean
  writesLimitedToMilestoneRegistry: true
  migrationsApplied: false
  schemaChangesApplied: false
  historicalBackfillRerun: false
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanValidationCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noToolRuntimeExecution: true
  noWorkerExecution: true
  noProviderCalls: true
  noMigrations: true
}

export interface ApprovedPlanValidationIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    phase52EOnly: true
    migrationsAllowed: false
    schemaChangesAllowed: false
    productRowWritesAllowed: false
    historicalBackfillAllowed: false
  }
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  blockedRoles: string[]
}

export interface ApprovedPlanValidationExecutionReport {
  ok: boolean
  phase: '52E'
  runId: string
  createdAt: string
  status: ApprovedPlanValidationExecutionStatus
  repoOwnershipAudit: ApprovedPlanRepoOwnershipAudit
  evidenceContext: ApprovedPlanEvidenceContext
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  candidateSchemaValidation: ApprovedPlanValidationResult
  blockedPlanValidation: ApprovedPlanValidationResult
  ownershipValidation: OwnershipValidationResult
  runtimeBlockValidation: RuntimeBlockValidationResult
  featureGateValidation: FeatureGateValidationResult
  systemReconciliation: SystemReconciliationSummary
  missingContractInventory: MissingContractInventory
  validatedHandoffs: ValidatedHandoffPacket[]
  manifest: ApprovedPlanValidationManifest
  qa: ApprovedPlanValidationQaSummary
  commandPlan: ApprovedPlanValidationCommandPlan
  iamPlan: ApprovedPlanValidationIamPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncInput: ActivationMilestoneSyncInput
  supabaseMilestoneBundle: SupabaseMilestoneBundle
  supabaseSyncPolicy: ApprovedPlanValidationSafetyFlags
  supabaseSyncResult: ApprovedPlanValidationSupabaseSyncResult
  artifacts: ApprovedPlanValidationArtifact[]
  safetyFlags: ApprovedPlanValidationSafetyFlags
  phase52FReadiness: Phase52FReadiness
  blockers: string[]
  warnings: string[]
}

export interface ApprovedPlanValidationReport {
  reportId: 'activation-phase-52e-approved-plan-snapshot-validation'
  createdAt: string
  phase: '52E'
  status: ApprovedPlanValidationStatus
  repoOwnershipAudit: ApprovedPlanRepoOwnershipAudit
  evidenceContext: ApprovedPlanEvidenceContext
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  candidateSchemaValidation: ApprovedPlanValidationResult
  blockedPlanValidation: ApprovedPlanValidationResult
  ownershipValidation: OwnershipValidationResult
  runtimeBlockValidation: RuntimeBlockValidationResult
  featureGateValidation: FeatureGateValidationResult
  systemReconciliation: SystemReconciliationSummary
  missingContractInventory: MissingContractInventory
  validatedHandoffs: ValidatedHandoffPacket[]
  manifest: ApprovedPlanValidationManifest
  qa: ApprovedPlanValidationQaSummary
  commandPlan: ApprovedPlanValidationCommandPlan
  iamPlan: ApprovedPlanValidationIamPlan
  executionReport?: ApprovedPlanValidationExecutionReport
  phase52FReadiness: Phase52FReadiness
  blockers: string[]
  warnings: string[]
}
