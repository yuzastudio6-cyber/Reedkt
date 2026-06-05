import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'
import type { ToolCapabilityRecord, ToolCapabilityTrack } from '../tool-capability-registry-audit'

export type MultiAgentDryRunStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type MultiAgentDryRunExecutionStatus = 'completed' | 'partial' | 'blocked'
export type MultiAgentDryRunPhase52DReadiness = 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' | 'blocked'

export type MultiAgentId =
  | 'director'
  | 'editor'
  | 'cinematographer'
  | 'colorist'
  | 'compositor_vfx'
  | 'motion'
  | 'audio'
  | 'search_research'
  | 'map_location'
  | 'graphics_design'
  | 'producer'
  | 'qa_safety'

export type MultiAgentScenarioId =
  | 'visual_video_private_review_improvement'
  | 'research_backed_video_planning'
  | 'map_location_context_card'
  | 'motion_graphics_lower_third_request'
  | 'audio_noise_cleanup_and_voice_request'
  | 'vlm_video_understanding_request'

export type MultiAgentIntentType =
  | 'conservative_color_adjustment'
  | 'caption_burnin_preview'
  | 'text_behind_subject_preview'
  | 'route_map_overlay'
  | 'location_context_card'
  | 'motion_graphics_lower_third'
  | 'noise_cleanup'
  | 'slow_motion_segment'
  | 'web_research_planning_context'
  | 'qwen_vlm_visual_understanding_request'
  | 'demucs_stem_separation_request'

export type MultiAgentQaGateId =
  | 'phase52b_evidence'
  | 'agent_coverage'
  | 'scenario_coverage'
  | 'finding_schema_compliance'
  | 'edit_intent_schema_compliance'
  | 'capability_gating'
  | 'producer_gate'
  | 'qa_safety_gate'
  | 'source_of_truth_policy'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface MultiAgentDryRunSafetyFlags extends SupabaseMilestoneSyncPolicy {
  dryRunOnly: true
  privateGcsArtifactUploadAllowed: boolean
  supabaseMilestoneSyncAllowed: boolean
  toolRuntimeExecutionAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  browserCaptureAllowed: false
  mapRenderingAllowed: false
  providerCallsAllowed: false
  gcpRuntimeMutationAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  migrationsAllowed: false
  schemaChangesAllowed: false
  historicalBackfillAllowed: false
}

export interface MultiAgentEvidenceRef {
  phaseId: string
  runId: string
  reference: string
  evidenceType: 'committed_doc' | 'private_gcs' | 'supabase_milestone' | 'capability_registry'
}

export interface MultiAgentEvidenceContext {
  phase52A: MultiAgentEvidenceRef
  phase52B: MultiAgentEvidenceRef
  canonicalRegistryRecordCount: number
  committedRegistryRecordCount: number
  supabaseCapabilityReadback: {
    attempted: boolean
    status: 'not_attempted' | 'completed' | 'blocked'
    recordCount: number
    expectedCount: number
    blockers: string[]
    warnings: string[]
  }
  capabilities: ToolCapabilityRecord[]
  capabilitySummary: {
    totalRecords: number
    byTrack: Record<ToolCapabilityTrack, number>
    internalTestingReadyCount: number
    blockedOrFutureCount: number
  }
  sourceOfTruthRules: string[]
  executionProof: {
    runtimeExecutionUsed: false
    workerExecutionUsed: false
    modelInferenceUsed: false
    providerCallUsed: false
    webSearchUsed: false
    browserCaptureUsed: false
    mapRenderingUsed: false
    mediaProcessingUsed: false
    migrationsUsed: false
  }
}

export interface MultiAgentDryRunScenario {
  scenarioId: MultiAgentScenarioId
  title: string
  requestedOutcome: string
  evidenceRefs: string[]
  participatingAgents: MultiAgentId[]
  requestedIntentTypes: MultiAgentIntentType[]
  constraints: string[]
  runtimeExecutionAllowed: false
  candidatePlanOnly: true
}

export interface MultiAgentFinding {
  findingId: string
  scenarioId: MultiAgentScenarioId
  agentId: MultiAgentId
  timestamp: string
  subject: string
  evidenceRefs: string[]
  confidence: 'high' | 'medium' | 'low'
  severity: 'info' | 'warning' | 'blocked'
  findingType: string
  summary: string
  recommendation: string
  uncertainty: string
  blocked: boolean
  blockedReason: string | null
  downstreamIntentCandidates: MultiAgentIntentType[]
  rawPromptExecution: false
  directToolExecution: false
}

export interface EditIntentCandidate {
  intentId: string
  scenarioId: MultiAgentScenarioId
  agentId: MultiAgentId
  intentType: MultiAgentIntentType
  targetScope: string
  evidenceRefs: string[]
  rationale: string
  proposedToolFamily: string
  requiredCapabilities: string[]
  estimatedCostClass: 'none' | 'low' | 'medium'
  riskLevel: 'low' | 'medium' | 'high'
  privacyImpact: 'private_artifacts_only' | 'blocked_sensitive_runtime'
  userApprovalRequired: boolean
  blocked: boolean
  blockedReason: string | null
  allowedInInternalTesting: boolean
  allowedInExternalBeta: false
  allowedInProduction: false
  candidatePlanOnly: true
  sourceOfTruthPolicy: string[]
}

export interface ProducerGateResult {
  intentId: string
  intentType: MultiAgentIntentType
  decision: 'allowed_candidate_plan_only' | 'blocked'
  reason: string
  capabilityMatches: Array<{ track: ToolCapabilityTrack; toolId: string; status: string; internalTestingReady: boolean }>
  candidatePlanOnly: true
  productionAllowed: false
  externalBetaAllowed: false
  publicArtifactAllowed: false
  rawPromptExecutionAllowed: false
}

export interface QaSafetyGateResult {
  gateId: string
  status: 'passed' | 'blocked'
  summary: string
  evidence: Record<string, unknown>
}

export interface MultiAgentDryRunManifest {
  manifestId: 'phase52c_multi_agent_dry_run_manifest'
  runId: string
  scenarioCount: number
  findingCount: number
  intentCount: number
  agentCoverage: MultiAgentId[]
  allowedIntentIds: string[]
  blockedIntentIds: string[]
  producerGateSummary: {
    allowedCandidatePlanOnly: number
    blocked: number
  }
  qaSafetyGateSummary: {
    passed: number
    blocked: number
  }
  sourceOfTruthPolicy: string[]
  runtimeExecutionUsed: false
  supabaseMilestoneSyncStatus: 'not_attempted' | 'completed' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface MultiAgentDryRunQaGate {
  gateId: MultiAgentQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface MultiAgentDryRunQaSummary {
  status: 'passed' | 'blocked'
  gates: MultiAgentDryRunQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface MultiAgentDryRunArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface MultiAgentDryRunSupabaseSyncResult {
  status: 'not_attempted' | 'completed' | 'blocked'
  schemaPresent: boolean
  inputValidated: boolean
  bundleValidated: boolean
  milestoneWrite: SupabaseMilestoneWriteVerification
  activationRunReadback: boolean
  writesLimitedToMilestoneRegistry: true
  migrationsApplied: false
  schemaChangesApplied: false
  blockers: string[]
  warnings: string[]
}

export interface MultiAgentDryRunCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noToolRuntimeExecution: true
  noProviderCalls: true
  noMigrations: true
}

export interface MultiAgentDryRunIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
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

export interface MultiAgentDryRunExecutionReport {
  ok: boolean
  phase: '52C'
  runId: string
  createdAt: string
  status: MultiAgentDryRunExecutionStatus
  evidenceContext: MultiAgentEvidenceContext
  scenarios: MultiAgentDryRunScenario[]
  findings: MultiAgentFinding[]
  editIntents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
  qaSafetyGateResults: QaSafetyGateResult[]
  manifest: MultiAgentDryRunManifest
  qa: MultiAgentDryRunQaSummary
  commandPlan: MultiAgentDryRunCommandPlan
  iamPlan: MultiAgentDryRunIamPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncInput: ActivationMilestoneSyncInput
  supabaseMilestoneBundle: SupabaseMilestoneBundle
  supabaseSyncPolicy: MultiAgentDryRunSafetyFlags
  supabaseSyncResult: MultiAgentDryRunSupabaseSyncResult
  artifacts: MultiAgentDryRunArtifact[]
  safetyFlags: MultiAgentDryRunSafetyFlags
  phase52DReadiness: MultiAgentDryRunPhase52DReadiness
  blockers: string[]
  warnings: string[]
}

export interface MultiAgentDryRunReport {
  reportId: 'activation-phase-52c-multi-agent-dry-run'
  createdAt: string
  phase: '52C'
  status: MultiAgentDryRunStatus
  evidenceContext: MultiAgentEvidenceContext
  scenarios: MultiAgentDryRunScenario[]
  findings: MultiAgentFinding[]
  editIntents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
  qaSafetyGateResults: QaSafetyGateResult[]
  manifest: MultiAgentDryRunManifest
  qa: MultiAgentDryRunQaSummary
  commandPlan: MultiAgentDryRunCommandPlan
  iamPlan: MultiAgentDryRunIamPlan
  executionReport?: MultiAgentDryRunExecutionReport
  phase52DReadiness: MultiAgentDryRunPhase52DReadiness
  blockers: string[]
  warnings: string[]
}
