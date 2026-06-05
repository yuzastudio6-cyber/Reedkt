import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'
import type { EditIntentCandidate, MultiAgentFinding, MultiAgentIntentType, ProducerGateResult } from '../multi-agent-dry-run'
import type { ToolCapabilityRecord, ToolCapabilityTrack } from '../tool-capability-registry-audit'

export type AgentToolPlanBridgeStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type AgentToolPlanBridgeExecutionStatus = 'completed' | 'partial' | 'blocked'
export type Phase52EReadiness = 'ready_for_approved_plan_snapshot_validation_system_reconciliation' | 'blocked'
export type AgentToolPlanDecision = 'candidate_plan_only' | 'handoff_only' | 'blocked'
export type AgentToolPlanOwnerRoute =
  | 'TRACK_A_RENDER_EXPORT'
  | 'WEB_SEARCH_CAPTURE'
  | 'MAP_GEOSPATIAL'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'WORKER_RUNTIME_JOBS'
  | 'SUPABASE_MILESTONE_SYNC'

export type AgentToolPlanQaGateId =
  | 'source_of_truth_repo_audit'
  | 'phase52c_evidence'
  | 'candidate_plan_generation'
  | 'blocked_plan_generation'
  | 'approved_plan_schema_compliance'
  | 'ownership_routing'
  | 'producer_plan_gate'
  | 'qa_plan_gate'
  | 'cross_track_handoffs'
  | 'source_of_truth_policy'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface AgentToolPlanBridgeSafetyFlags extends SupabaseMilestoneSyncPolicy {
  repoAuditRequired: true
  candidatePlanGenerationAllowed: true
  crossTrackHandoffGenerationAllowed: true
  privateGcsArtifactUploadAllowed: true
  supabaseMilestoneSyncAllowed: true
  supabaseWritesLimitedToPhase52D: true
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

export interface AgentToolPlanBridgeConfig {
  phase: '52D'
  mode: 'agent_to_tool_plan_bridge_existing_evidence'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52CRunId: 'phase52c-20260605T134904'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-agents/phase52d'
  branch: 'codex/rp-activation-52d-agent-to-tool-plan-bridge'
  baseBranch: 'codex/rp-activation-52c-multi-agent-dry-run-existing-evidence'
}

export interface SourceTruthFileAudit {
  path: string
  present: boolean
  role: 'required_source_of_truth' | 'optional_cross_chat' | 'agent_contract'
  note: string
}

export interface RepoOwnershipAudit {
  auditId: 'phase52d_repo_ownership_audit'
  createdAt: string
  workstreamOwner: 'shared_agent_tool_coordination'
  relatedWorkstreams: AgentToolPlanOwnerRoute[]
  explicitlyNotOwned: string[]
  integrationPoints: string[]
  filesInspected: SourceTruthFileAudit[]
  missingExpectedFiles: string[]
  duplicateBridgeDetected: false
  duplicateRisk: 'none_detected'
  implementationAllowed: boolean
  findings: string[]
  blockers: string[]
  warnings: string[]
}

export interface AgentToolPlanEvidenceContext {
  phase52A: { runId: 'phase52a-20260605T111515'; status: 'completed'; reference: string }
  phase52B: { runId: 'phase52b-20260605T121905'; status: 'completed'; reference: string; capabilityRecordCount: number }
  phase52C: { runId: 'phase52c-20260605T134904'; status: 'completed'; reference: string }
  sourceAgentFindings: MultiAgentFinding[]
  sourceEditIntents: EditIntentCandidate[]
  sourceProducerGateResults: ProducerGateResult[]
  capabilityRecords: ToolCapabilityRecord[]
  supabaseCapabilityReadback: {
    attempted: boolean
    status: 'not_attempted' | 'completed' | 'blocked'
    recordCount: number
    expectedCount: number
    blockers: string[]
    warnings: string[]
  }
  contextFlags: {
    trackAInternalTestingReady: boolean
    webSearchInternalBetaCandidateReady: boolean
    mapGeospatialInternalTestingReady: boolean
    supabaseMilestoneSyncReady: boolean
    aiToolsPlaceholdersPendingExternalManifest: boolean
    trackBVlmExcluded: boolean
    trackBDemucsBlockedPendingProvenance: boolean
    workerExecutionNotOwnedHere: true
    productionExternalBetaBroadMediaBlocked: true
  }
  sourceOfTruthRules: string[]
  blockers: string[]
  warnings: string[]
}

export interface CandidateApprovedPlanSnapshot {
  planId: string
  planVersion: 'phase52d_candidate_v1'
  createdAt: string
  sourceRequestId: string
  sourceScenarioId: string
  sourceFindingIds: string[]
  sourceIntentIds: string[]
  sourceIntentTypes: MultiAgentIntentType[]
  decision: 'candidate_plan_only'
  executionStatus: 'candidate_only'
  approvedByPolicy: false
  candidateOnly: true
  rawPromptExecution: false
  workerExecutionAllowed: false
  approvedForRuntime: false
  requiresFutureOwnerApproval: boolean
  inputArtifactScope: string[]
  outputArtifactScope: string[]
  selectedToolRoutes: Array<{
    ownerRoute: AgentToolPlanOwnerRoute
    track: ToolCapabilityTrack | 'worker_runtime'
    toolIds: string[]
    capabilities: string[]
    ownerType: 'this_chat' | 'track_a' | 'track_b' | 'ai_tools' | 'worker_runtime'
  }>
  selectedIntents: MultiAgentIntentType[]
  rejectedIntents: MultiAgentIntentType[]
  safetyFlags: {
    publicArtifactAllowed: false
    signedUrlSourceOfTruthAllowed: false
    providerCallsAllowed: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadMediaAllowed: false
    toolRuntimeAllowed: false
    modelInferenceAllowed: false
  }
  budgetLimits: {
    maxRuntimeCostUsd: 0
    creditReservationRequiredBeforeExecution: true
  }
  privacyLimits: string[]
  runtimeLimits: string[]
  allowedBuckets: string[]
  allowedPrefixes: string[]
  qaRequirements: string[]
  rollbackPolicy: string
  crossTrackOwner: AgentToolPlanOwnerRoute
  handoffRequired: boolean
  sourceOfTruthPolicy: string[]
  supabaseMilestoneSyncPolicy: 'phase51d_milestone_sync_only'
}

export interface BlockedPlanRecord {
  planId: string
  planVersion: 'phase52d_blocked_v1'
  sourceScenarioId: string
  sourceFindingIds: string[]
  sourceIntentIds: string[]
  sourceIntentTypes: MultiAgentIntentType[]
  decision: 'handoff_only' | 'blocked'
  executionStatus: 'blocked_or_handoff_only'
  ownerRoute: AgentToolPlanOwnerRoute
  requiredCapabilities: string[]
  blockedReason: string
  ownerActionNeeded: string
  rawPromptExecution: false
  workerExecutionAllowed: false
  approvedForRuntime: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  sourceOfTruthPolicy: string[]
}

export interface ProducerPlanGateResult {
  planId: string
  decision: AgentToolPlanDecision
  ownerRoute: AgentToolPlanOwnerRoute
  requiredCapabilitiesPresent: boolean
  ownerRouteValid: boolean
  candidatePlanOnly: boolean
  runtimeExecutionBlocked: boolean
  productionAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  reason: string
  blockers: string[]
}

export interface QaPlanGateResult {
  gateId: string
  status: 'passed' | 'blocked'
  summary: string
  evidence: Record<string, unknown>
}

export interface CrossTrackHandoffPacket {
  packetId: string
  targetWorkstream: AgentToolPlanOwnerRoute
  candidatePlanIds: string[]
  blockedPlanIds: string[]
  requiredCapabilities: string[]
  ownerActionNeeded: string[]
  dependencies: string[]
  evidenceRefs: string[]
  prohibitedActions: string[]
  supabaseMilestoneRefs: string[]
  nextRecommendedPhaseOrPromptOwner: string
}

export interface AgentToolPlanBridgeManifest {
  manifestId: 'phase52d_agent_tool_plan_bridge_manifest'
  runId: string
  phase: '52D'
  repoOwnershipAudit: RepoOwnershipAudit
  evidenceContextSummary: {
    findingCount: number
    editIntentCount: number
    capabilityRecordCount: number
    phase52CRunId: string
  }
  candidatePlanIds: string[]
  blockedPlanIds: string[]
  handoffPacketIds: string[]
  producerGateSummary: {
    candidatePlanOnly: number
    handoffOnly: number
    blocked: number
  }
  qaGateSummary: {
    passed: number
    blocked: number
  }
  sourceOfTruthSummary: string[]
  supabaseMilestoneSyncStatus: 'not_attempted' | 'completed' | 'blocked'
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase52EReadiness: Phase52EReadiness
}

export interface AgentToolPlanBridgeQaGate {
  gateId: AgentToolPlanQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface AgentToolPlanBridgeQaSummary {
  status: 'passed' | 'blocked'
  gates: AgentToolPlanBridgeQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface AgentToolPlanBridgeArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface AgentToolPlanBridgeSupabaseSyncResult {
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

export interface AgentToolPlanBridgeCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noToolRuntimeExecution: true
  noWorkerExecution: true
  noProviderCalls: true
  noMigrations: true
}

export interface AgentToolPlanBridgeIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    phase52DOnly: true
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

export interface AgentToolPlanBridgeExecutionReport {
  ok: boolean
  phase: '52D'
  runId: string
  createdAt: string
  status: AgentToolPlanBridgeExecutionStatus
  repoOwnershipAudit: RepoOwnershipAudit
  evidenceContext: AgentToolPlanEvidenceContext
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  producerGateResults: ProducerPlanGateResult[]
  qaPlanGateResults: QaPlanGateResult[]
  handoffPackets: CrossTrackHandoffPacket[]
  manifest: AgentToolPlanBridgeManifest
  qa: AgentToolPlanBridgeQaSummary
  commandPlan: AgentToolPlanBridgeCommandPlan
  iamPlan: AgentToolPlanBridgeIamPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncInput: ActivationMilestoneSyncInput
  supabaseMilestoneBundle: SupabaseMilestoneBundle
  supabaseSyncPolicy: AgentToolPlanBridgeSafetyFlags
  supabaseSyncResult: AgentToolPlanBridgeSupabaseSyncResult
  artifacts: AgentToolPlanBridgeArtifact[]
  safetyFlags: AgentToolPlanBridgeSafetyFlags
  phase52EReadiness: Phase52EReadiness
  blockers: string[]
  warnings: string[]
}

export interface AgentToolPlanBridgeReport {
  reportId: 'activation-phase-52d-agent-tool-plan-bridge'
  createdAt: string
  phase: '52D'
  status: AgentToolPlanBridgeStatus
  repoOwnershipAudit: RepoOwnershipAudit
  evidenceContext: AgentToolPlanEvidenceContext
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
  producerGateResults: ProducerPlanGateResult[]
  qaPlanGateResults: QaPlanGateResult[]
  handoffPackets: CrossTrackHandoffPacket[]
  manifest: AgentToolPlanBridgeManifest
  qa: AgentToolPlanBridgeQaSummary
  commandPlan: AgentToolPlanBridgeCommandPlan
  iamPlan: AgentToolPlanBridgeIamPlan
  executionReport?: AgentToolPlanBridgeExecutionReport
  phase52EReadiness: Phase52EReadiness
  blockers: string[]
  warnings: string[]
}
