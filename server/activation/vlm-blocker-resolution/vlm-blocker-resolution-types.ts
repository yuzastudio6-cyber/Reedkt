export type VlmBlockerResolutionStatus = 'planned' | 'completed' | 'blocked'
export type VlmBlockerDecision = 'vlm_runtime_resolved' | 'vlm_excluded_from_initial_internal_testing' | 'still_blocked'

export type VlmBlockerResolutionGateId =
  | 'phase47a_evidence'
  | 'vlm_blocker_evidence'
  | 'decision_integrity'
  | 'runtime_resolution'
  | 'exclusion_integrity'
  | 'system_readiness_impact'
  | 'blocked_features'

export interface VlmBlockerResolutionConfig {
  phase: '47B'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'vlm_blocker_resolution_exclusion_gate'
  phase47aRunId: 'phase47a-20260601T02252'
  phase47aReportGcsUri: string
  phase39cRunId: 'phase39c-20260531T214216'
  phase39cReportGcsUri: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
}

export interface VlmBlockerEvidence {
  phase39cRunId: string
  modelId: string
  revision: string
  modelGcsPath: string
  aggregateSha256: string
  runtime: 'vllm'
  vllmVersion: string
  gpuType: 'L4'
  cloudRunJobName: string
  cloudRunExecutionId: string
  runtimeImage: string
  oomStage: 'vllm_engine_initialization_before_generated_fixture_inference'
  exactBlocker: string
  qaArtifactsProduced: boolean
  qaReportUri: string
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeDecision {
  decision: VlmBlockerDecision
  runtimeFixAttempted: boolean
  runtimeFixResult: 'not_attempted_out_of_scope' | 'passed' | 'failed'
  reason: string
  forbiddenRequiredChanges: string[]
}

export interface VlmExclusionPolicy {
  vlmIncludedInInitialInternalTesting: false
  vlmUserFacingEnabled: false
  vlmRuntimeEnabled: false
  vlmFutureScoped: true
  exclusionReason: string
  requiredFutureAction: string[]
  providerFallbackAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}

export interface VlmSystemReadinessImpact {
  phase47CReadiness: 'ready_for_system_level_internal_testing_gate_preparation_without_vlm' | 'blocked'
  systemLevelInternalTestingMayProceedWithoutVlm: boolean
  trackAStatus: 'ready'
  trackBStatus: 'partial_without_vlm'
  remainingBlockers: string[]
  notes: string[]
}

export interface VlmBlockerResolutionArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface VlmBlockerResolutionQaGate {
  gateId: VlmBlockerResolutionGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface VlmBlockerResolutionQaSummary {
  status: 'passed' | 'blocked'
  gates: VlmBlockerResolutionQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface VlmBlockerResolutionExecutionReport {
  ok: boolean
  phase: '47B'
  runId: string
  projectId: 'reeditpro'
  runtimeMode: 'vlm_blocker_resolution_exclusion_gate'
  phase47aEvidenceStatus: 'verified' | 'blocked'
  decision: VlmRuntimeDecision
  blockerEvidence: VlmBlockerEvidence
  exclusionPolicy: VlmExclusionPolicy
  systemReadinessImpact: VlmSystemReadinessImpact
  artifacts: VlmBlockerResolutionArtifact[]
  qa: VlmBlockerResolutionQaSummary
  safety: {
    mediaProcessed: false
    providerExecuted: false
    dockerBuiltOrPushed: false
    cloudRunDeployedOrExecuted: false
    modelDownloaded: false
    publicAccessEnabled: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    finalDeliveryAllowed: false
    revideoUsed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedVlmBlockerResolutionEvidence {
  phase: '47B'
  status: 'not_run' | 'completed' | 'blocked'
  runId?: string
  decision: VlmBlockerDecision
  blockerEvidenceUri?: string
  exclusionManifestUri?: string
  systemReadinessImpactUri?: string
  qaReportUri?: string
  phase47bReportUri?: string
  runtimeFixAttempted: boolean
  runtimeFixResult: VlmRuntimeDecision['runtimeFixResult']
  exclusionApplied: boolean
  phase47CReadiness: VlmSystemReadinessImpact['phase47CReadiness']
  blockers: string[]
  warnings: string[]
}

export interface VlmBlockerResolutionReport {
  reportId: 'activation-phase-47b-vlm-blocker-resolution'
  createdAt: string
  config: VlmBlockerResolutionConfig
  approvedEvidence: ApprovedVlmBlockerResolutionEvidence
  executionReport?: VlmBlockerResolutionExecutionReport
  status: VlmBlockerResolutionStatus
  decision: VlmBlockerDecision
  blockerEvidence: VlmBlockerEvidence
  runtimeDecision: VlmRuntimeDecision
  exclusionPolicy: VlmExclusionPolicy
  systemReadinessImpact: VlmSystemReadinessImpact
  qa: VlmBlockerResolutionQaSummary
  blockers: string[]
  warnings: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface VlmBlockerResolutionIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  reportOnly: true
}

export interface VlmBlockerResolutionCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute' | 'validation'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}
