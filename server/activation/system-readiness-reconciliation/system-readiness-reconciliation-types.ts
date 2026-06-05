import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'

export type SystemReadinessStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type Phase52GReadiness = 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' | 'blocked'

export type WorkstreamId =
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'MAP_GEOSPATIAL'
  | 'SOUND_MUSIC_AUDIO'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'WORKER_RUNTIME_JOBS'
  | 'COMPLIANCE_SECURITY'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'FRONTEND_PRODUCT_UX'
  | 'BILLING_STRIPE_CREDITS'

export type WorkstreamReadinessStatus =
  | 'ready_for_controlled_internal_testing'
  | 'ready_for_internal_private_visual_video_testing'
  | 'milestone_registry_operational'
  | 'external_track_owned_pending_manifest'
  | 'owner_follow_up_required'
  | 'partial'

export type SystemReadinessQaGateId =
  | 'source_of_truth_repo_audit'
  | 'phase52e_evidence'
  | 'workstream_readiness_reconciliation'
  | 'controlled_internal_test_plan'
  | 'blocker_inventory'
  | 'feature_gate_reconciliation'
  | 'risk_register'
  | 'handoff_packets'
  | 'source_of_truth_policy'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface SystemReadinessSafetyFlags extends SupabaseMilestoneSyncPolicy {
  repoAuditRequired: true
  systemReadinessReconciliationAllowed: true
  controlledInternalTestPlanningAllowed: true
  crossTrackHandoffGenerationAllowed: true
  privateGcsArtifactUploadAllowed: true
  supabaseMilestoneSyncAllowed: true
  supabaseWritesLimitedToPhase52F: true
  candidatePlanGenerationAllowed: false
  approvedPlanSnapshotExecutionAllowed: false
  toolRuntimeAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  mapRenderingAllowed: false
  browserCaptureAllowed: false
  providerCallsAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  migrationsAllowed: false
  schemaChangesAllowed: false
  historicalBackfillAllowed: false
}

export interface SystemReadinessConfig {
  phase: '52F'
  mode: 'system_readiness_reconciliation_controlled_internal_test_plan'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52ERunId: 'phase52e-20260605T175613'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-agents/phase52f'
  branch: 'codex/rp-activation-52f-system-readiness-reconciliation-internal-test-plan'
  baseBranch: 'codex/rp-activation-52e-approved-plan-snapshot-validation-system-reconciliation'
}

export interface SystemSourceFileAudit {
  path: string
  present: boolean
  category: 'required_base_contract' | 'agent_contract' | 'foundation_contract' | 'cross_chat_contract'
  blockingForPhase52F: boolean
  owner: string
  finding: string
  recommendedAction: string
}

export interface SystemRepoOwnershipAudit {
  auditId: 'phase52f_repo_ownership_audit'
  createdAt: string
  workstreamOwner: 'shared_system_integration_readiness_layer'
  relatedWorkstreams: WorkstreamId[]
  explicitlyNotOwned: string[]
  integrationPoints: string[]
  filesInspected: SystemSourceFileAudit[]
  missingSourceOfTruthDocs: SystemSourceFileAudit[]
  duplicateSystemReadinessImplementationDetected: boolean
  implementationAllowed: boolean
  findings: string[]
  blockers: string[]
  warnings: string[]
}

export interface SystemEvidenceRef {
  phaseId: string
  runId: string
  status: 'completed' | 'ready' | 'planned' | 'blocked'
  reference: string
  summary: string
}

export interface SystemEvidenceContext {
  evidenceId: 'phase52f_system_readiness_evidence_context'
  phase52E: SystemEvidenceRef
  upstreamEvidence: SystemEvidenceRef[]
  sourceOfTruthDocsPresent: string[]
  sourceOfTruthDocsMissing: string[]
  contextFlags: {
    trackAVisualVideoInternalReady: boolean
    webSearchInternalBetaCandidateReady: boolean
    mapGeospatialInternalTestingReady: boolean
    supabaseMilestoneSyncOperational: boolean
    sharedAgentArchitectureOperational: boolean
    toolCapabilityRegistryOperational: boolean
    multiAgentDryRunCompleted: boolean
    approvedPlanSnapshotsValidated: boolean
    aiToolsPlaceholdersPendingExternalManifest: boolean
    trackBVlmExcluded: boolean
    trackBDemucsBlocked: boolean
    workerRuntimeExecutionNotOwnedHere: true
    providerGatewayExecutionNotEnabled: true
    productionExternalBetaBroadMediaBlocked: true
  }
  blockers: string[]
  warnings: string[]
}

export interface WorkstreamReadinessRecord {
  workstream: WorkstreamId
  status: WorkstreamReadinessStatus
  readyFor: string[]
  blockedScope: string[]
  currentEvidence: string[]
  requiredOwner: string
  recommendedNextPrompt: string
  internalTestingCandidate: boolean
  internalBetaCandidate: boolean
}

export interface ControlledInternalTestLane {
  laneId: string
  ownerWorkstream: WorkstreamId
  readiness: string
  allowedScope: string[]
  blockedScope: string[]
  requiredEvidence: string[]
  requiredNextPrompt: string
  safetyConstraints: string[]
  supabaseMilestoneRefs: string[]
  executableInPhase52F: false
}

export interface SystemBlockerRecord {
  blockerId: string
  workstream: WorkstreamId | 'SYSTEM'
  severity: 'low' | 'medium' | 'high' | 'critical'
  blocksInternalTesting: boolean
  blocksInternalBeta: boolean
  blocksExternalBeta: boolean
  blocksProduction: boolean
  currentEvidence: string
  requiredOwner: string
  recommendedNextPrompt: string
}

export interface FeatureGateReconciliationRecord {
  gateKey: string
  expectedEnabled: false
  actualEnabled: false
  source: 'phase52f_policy' | 'phase52e_evidence' | 'supabase_milestone_policy'
  status: 'passed'
}

export interface SystemRiskRecord {
  riskId: string
  category:
    | 'ownership_conflict'
    | 'missing_contracts'
    | 'runtime_execution_boundary'
    | 'supabase_sync'
    | 'privacy_artifact_policy'
    | 'tool_capability_mismatch'
    | 'track_b_model_runtime'
    | 'ai_tools_manifest_gap'
    | 'worker_runtime_gap'
    | 'provider_gateway_gap'
    | 'compliance_gap'
    | 'observability_cost_gap'
    | 'frontend_ux_gap'
    | 'billing_gap'
  severity: 'low' | 'medium' | 'high' | 'critical'
  currentStatus: string
  mitigation: string
  owner: string
  nextAction: string
}

export interface SystemHandoffPacket {
  packetId: string
  workstream: WorkstreamId
  currentEvidence: string[]
  readyScope: string[]
  blockedScope: string[]
  candidatePlansRelevant: string[]
  requiredContracts: string[]
  recommendedNextPrompt: string
  prohibitedActions: string[]
  supabaseRefs: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface SystemReadinessManifest {
  manifestId: 'phase52f_system_readiness_reconciliation_manifest'
  runId: string
  phase: '52F'
  repoOwnershipAudit: SystemRepoOwnershipAudit
  evidenceContext: SystemEvidenceContext
  workstreamReadiness: WorkstreamReadinessRecord[]
  controlledInternalTestPlan: ControlledInternalTestLane[]
  blockerInventory: SystemBlockerRecord[]
  featureGateReconciliation: FeatureGateReconciliationRecord[]
  systemRiskRegister: SystemRiskRecord[]
  handoffPackets: SystemHandoffPacket[]
  sourceOfTruthSummary: string[]
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase52GReadiness: Phase52GReadiness
}

export interface SystemReadinessQaGate {
  gateId: SystemReadinessQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface SystemReadinessQaSummary {
  status: 'passed' | 'blocked'
  gates: SystemReadinessQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SystemReadinessArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SystemReadinessSupabaseSyncResult {
  status: 'completed' | 'blocked' | 'not_attempted'
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

export interface SystemReadinessExecutionReport {
  ok: boolean
  phase: '52F'
  runId: string
  createdAt: string
  status: Exclude<SystemReadinessStatus, 'planned'>
  repoOwnershipAudit: SystemRepoOwnershipAudit
  evidenceContext: SystemEvidenceContext
  workstreamReadiness: WorkstreamReadinessRecord[]
  controlledInternalTestPlan: ControlledInternalTestLane[]
  blockerInventory: SystemBlockerRecord[]
  featureGateReconciliation: FeatureGateReconciliationRecord[]
  systemRiskRegister: SystemRiskRecord[]
  handoffPackets: SystemHandoffPacket[]
  manifest: SystemReadinessManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: SystemReadinessSupabaseSyncResult
  commandPlan: SystemReadinessCommandPlan
  iamPlan: SystemReadinessIamPlan
  qa: SystemReadinessQaSummary
  artifacts: SystemReadinessArtifact[]
  phase52GReadiness: Phase52GReadiness
  blockers: string[]
  warnings: string[]
}

export interface SystemReadinessReport {
  reportId: 'activation-phase-52f-system-readiness-reconciliation'
  createdAt: string
  phase: '52F'
  status: SystemReadinessStatus
  repoOwnershipAudit: SystemRepoOwnershipAudit
  evidenceContext: SystemEvidenceContext
  workstreamReadiness: WorkstreamReadinessRecord[]
  controlledInternalTestPlan: ControlledInternalTestLane[]
  blockerInventory: SystemBlockerRecord[]
  featureGateReconciliation: FeatureGateReconciliationRecord[]
  systemRiskRegister: SystemRiskRecord[]
  handoffPackets: SystemHandoffPacket[]
  manifest: SystemReadinessManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification?: SupabaseRegistrySchemaVerification
  supabaseSyncResult: SystemReadinessSupabaseSyncResult
  commandPlan: SystemReadinessCommandPlan
  iamPlan: SystemReadinessIamPlan
  qa: SystemReadinessQaSummary
  executionReport?: SystemReadinessExecutionReport
  phase52GReadiness: Phase52GReadiness
  blockers: string[]
  warnings: string[]
}

export interface SystemReadinessCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_reconciliation_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noToolRuntimeExecution: true
  noWorkerExecution: true
  noProviderCalls: true
  noMigrations: true
  noHistoricalBackfill: true
}

export interface SystemReadinessIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    phase52FOnly: true
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
