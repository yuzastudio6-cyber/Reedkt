import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'
import type {
  SystemBlockerRecord,
  SystemEvidenceContext,
  SystemRepoOwnershipAudit,
  SystemRiskRecord,
  WorkstreamId,
} from '../system-readiness-reconciliation'

export type { WorkstreamId }

export type GoNoGoStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type Phase52HReadiness = 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' | 'blocked'
export type GoNoGoDecisionValue =
  | 'go_for_controlled_internal_planning'
  | 'go_for_owner_handoff'
  | 'conditional_go_for_non_executing_internal_test_plan'
  | 'no_go_for_runtime_execution'
  | 'no_go_for_external_beta'
  | 'no_go_for_production'

export type WorkstreamGoNoGoStatus =
  | 'go_for_controlled_internal_planning'
  | 'go_for_owner_handoff'
  | 'owner_handoff_required'
  | 'milestone_sync_ready'
  | 'partial_owner_handoff_required'
  | 'no_go_for_execution'

export interface GoNoGoConfig {
  phase: '52G'
  mode: 'controlled_internal_test_go_no_go_handoff_dispatch'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52FRunId: 'phase52f-20260605T185559'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-agents/phase52g'
  branch: 'codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch'
  baseBranch: 'codex/rp-activation-52f-system-readiness-reconciliation-internal-test-plan'
}

export interface GoNoGoSafetyFlags extends SupabaseMilestoneSyncPolicy {
  repoAuditRequired: true
  goNoGoPacketAllowed: true
  ownerHandoffDispatchAllowed: true
  controlledInternalTestPlanningAllowed: true
  crossTrackHandoffGenerationAllowed: true
  supabaseMilestoneSyncAllowed: true
  supabaseWritesLimitedToPhase52G: true
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

export interface GoNoGoSourceAudit extends Omit<SystemRepoOwnershipAudit, 'auditId'> {
  auditId: 'phase52g_repo_ownership_audit'
  duplicateGoNoGoImplementationDetected: boolean
}

export interface GoNoGoEvidenceContext {
  evidenceId: 'phase52g_go_no_go_evidence_context'
  phase52FRunId: 'phase52f-20260605T185559'
  phase52FStatus: 'completed'
  phase52FQa: 'passed'
  phase52FSupabaseSync: 'completed'
  phase52GReadinessFromPhase52F: 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch'
  baseContext: SystemEvidenceContext
  contextFlags: SystemEvidenceContext['contextFlags'] & {
    phase52FCompleted: true
    phase52GIsCoordinationOnly: true
  }
  blockers: string[]
  warnings: string[]
}

export interface WorkstreamGoNoGoDecision {
  workstream: WorkstreamId
  decision: WorkstreamGoNoGoStatus
  runtimeDecision: 'no_go'
  planningAllowed: boolean
  handoffRequired: boolean
  reason: string
  requiredOwner: string
  recommendedNextPrompt: string
  evidence: string[]
  blockedScope: string[]
}

export interface InternalTestScopeClassification {
  workstream: WorkstreamId
  classification: 'controlled_internal_planning' | 'owner_handoff_only' | 'blocked_runtime'
  laneReady: boolean
  executionAllowed: false
  notes: string[]
}

export interface GoNoGoDecisionPacket {
  packetId: 'phase52g_controlled_internal_test_go_no_go_decision'
  runId: string
  phase: '52G'
  topLevelDecision: {
    positive: Extract<GoNoGoDecisionValue, 'go_for_owner_handoff' | 'conditional_go_for_non_executing_internal_test_plan'>[]
    blocked: Extract<GoNoGoDecisionValue, 'no_go_for_runtime_execution' | 'no_go_for_external_beta' | 'no_go_for_production'>[]
    runtimeGoEmitted: false
    externalBetaGoEmitted: false
    productionGoEmitted: false
  }
  workstreamDecisions: WorkstreamGoNoGoDecision[]
  rationale: string[]
}

export interface ControlledInternalTestPacket {
  packetId: 'phase52g_controlled_internal_test_packet'
  objective: string
  allowedPlanningLanes: string[]
  disallowedExecutionLanes: string[]
  ownerAssignments: Array<{ workstream: WorkstreamId; owner: string; nextPrompt: string }>
  requiredPrompts: string[]
  inputArtifactConstraints: string[]
  outputArtifactConstraints: string[]
  supabaseMilestoneRequirements: string[]
  qaRequirements: string[]
  successCriteria: string[]
  stopConditions: string[]
  rollbackPolicy: string[]
  prohibitedActions: string[]
}

export interface OwnerHandoffPromptPacket {
  packetId: string
  fileName: string
  workstream: WorkstreamId
  owner: string
  content: string
}

export interface GoNoGoBlockerRecord extends SystemBlockerRecord {
  phase52GRequired: true
}

export interface GoNoGoExposureRecord extends SystemRiskRecord {
  phase52GOwnerDispatchRequired: boolean
}

export interface OwnerHandoffDispatchManifest {
  manifestId: 'phase52g_owner_handoff_dispatch_manifest'
  runId: string
  phase: '52G'
  topLevelDecision: GoNoGoDecisionPacket['topLevelDecision']
  workstreamDecisions: WorkstreamGoNoGoDecision[]
  controlledInternalTestPacket: ControlledInternalTestPacket
  ownerPromptPackets: Array<{ packetId: string; fileName: string; workstream: WorkstreamId }>
  blockerInventory: GoNoGoBlockerRecord[]
  sourceOfTruthSummary: string[]
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase52HReadiness: Phase52HReadiness
}

export interface GoNoGoQaGate {
  gateId:
    | 'source_of_truth_repo_audit'
    | 'phase52f_evidence'
    | 'go_no_go_decision'
    | 'workstream_decisions'
    | 'controlled_internal_test_packet'
    | 'owner_prompt_packets'
    | 'blocker_inventory'
    | 'source_of_truth_policy'
    | 'supabase_milestone_sync'
    | 'blocked_features'
  passed: boolean
  mandatory: true
  summary: string
}

export interface GoNoGoQaSummary {
  status: 'passed' | 'blocked'
  gates: GoNoGoQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface GoNoGoArtifact {
  id: string
  kind: 'private_json' | 'private_markdown'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface GoNoGoSupabaseSyncResult {
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
  unrelatedSupabaseRowsWritten: false
  blockers: string[]
  warnings: string[]
}

export interface GoNoGoCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_go_no_go_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noToolRuntimeExecution: true
  noWorkerExecution: true
  noProviderCalls: true
  noMigrations: true
  noHistoricalBackfill: true
}

export interface GoNoGoIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    phase52GOnly: true
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

export interface GoNoGoExecutionReport {
  ok: boolean
  phase: '52G'
  runId: string
  createdAt: string
  status: Exclude<GoNoGoStatus, 'planned'>
  repoOwnershipAudit: GoNoGoSourceAudit
  evidenceContext: GoNoGoEvidenceContext
  scopeClassifications: InternalTestScopeClassification[]
  decisionPacket: GoNoGoDecisionPacket
  controlledInternalTestPacket: ControlledInternalTestPacket
  ownerPromptPackets: OwnerHandoffPromptPacket[]
  blockerInventory: GoNoGoBlockerRecord[]
  exposureRegister: GoNoGoExposureRecord[]
  dispatchManifest: OwnerHandoffDispatchManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: GoNoGoSupabaseSyncResult
  commandPlan: GoNoGoCommandPlan
  iamPlan: GoNoGoIamPlan
  qa: GoNoGoQaSummary
  artifacts: GoNoGoArtifact[]
  phase52HReadiness: Phase52HReadiness
  blockers: string[]
  warnings: string[]
}

export interface GoNoGoReport extends Omit<GoNoGoExecutionReport, 'ok' | 'status' | 'runId' | 'createdAt' | 'schemaVerification' | 'artifacts'> {
  reportId: 'activation-phase-52g-controlled-internal-test-go-no-go'
  createdAt: string
  status: GoNoGoStatus
  runId: string
  schemaVerification?: SupabaseRegistrySchemaVerification
  artifacts: GoNoGoArtifact[]
  executionReport?: GoNoGoExecutionReport
}
