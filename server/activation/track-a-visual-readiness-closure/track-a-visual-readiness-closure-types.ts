export type TrackAVisualReadinessGateId =
  | 'track_a_evidence_chain'
  | 'tool_scope_integrity'
  | 'report_consistency'
  | 'artifact_privacy'
  | 'private_e2e_review_integrity'
  | 'scripts_validation'
  | 'docs_consistency'
  | 'blocked_features'
  | 'no_public_access'
  | 'no_final_delivery'

export interface TrackAVisualReadinessConfig {
  phase: '45F'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'track_a_visual_readiness_closure'
  approvedPhase45ERunId: 'phase45e-20260531T23580'
  approvedPhase45EManifestGcsUri: string
  approvedPhase45EReportGcsUri: string
  canonicalPrivateReviewExportGcsUri: string
  generatedAssetsBucket: string
  qaBucket: string
  finalExportsBucket: string
  previewsBucket: string
  masksBucket: string
  reportObjectPrefix: string
}

export interface TrackAVisualEvidenceItem {
  phase: string
  label: string
  reportId: string
  reportScript: string
  runId: string
  status: string
  readyForInternalTrackA: boolean
  internalReadinessBlockers: string[]
  expectedScopeBlockers: string[]
  artifactUris: string[]
  summary: string
}

export interface TrackAVisualReadinessArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface TrackAVisualReadinessQaGate {
  gateId: TrackAVisualReadinessGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface TrackAVisualReadinessQaSummary {
  status: 'passed' | 'blocked'
  gates: TrackAVisualReadinessQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface TrackAVisualReadinessExecutionReport {
  ok: boolean
  phase: '45F'
  runId: string
  projectId: 'reeditpro'
  runtimeMode: 'track_a_visual_readiness_closure'
  evidenceChain: TrackAVisualEvidenceItem[]
  privateE2EArtifactValidation: {
    phase45ERunId: string
    canonicalPrivateReviewExportGcsUri: string
    canonicalPrivateReviewExportExists: boolean
    canonicalPrivateReviewExportSizeBytes: number
    e2eReviewManifestGcsUri: string
    e2eReviewManifestExists: boolean
    e2eReviewManifestSizeBytes: number
    phase45EReportGcsUri: string
    phase45EReportExists: boolean
    phase45EReportSizeBytes: number
    privateGcsOnly: boolean
  }
  readinessManifestGcsUri: string
  artifacts: TrackAVisualReadinessArtifact[]
  qa: TrackAVisualReadinessQaSummary
  trackAInternalReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
    reason: string
  }
  remainingTrackABlockers: string[]
  safety: {
    newMediaProcessed: false
    renderCreated: false
    finalDeliveryCreated: false
    providerExecuted: false
    revideoUsed: false
    trackBToolsUsed: false
    publicAccessEnabled: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedTrackAVisualReadinessClosureEvidence {
  phase: '45F'
  status: 'not_run' | 'verified' | 'blocked'
  runId?: string
  readinessManifestUri?: string
  evidenceChainUri?: string
  privateE2EArtifactValidationUri?: string
  qaReportUri?: string
  trackAInternalReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
    reason: string
  }
  remainingTrackABlockers: string[]
  blockers: string[]
  warnings: string[]
}

export interface TrackAVisualReadinessClosureReport {
  reportId: 'activation-phase-45f-track-a-visual-video-readiness-closure'
  createdAt: string
  config: TrackAVisualReadinessConfig
  approvedEvidence: ApprovedTrackAVisualReadinessClosureEvidence
  executionReport?: TrackAVisualReadinessExecutionReport
  status: 'planned' | 'ready' | 'blocked'
  evidenceChain: TrackAVisualEvidenceItem[]
  blockers: string[]
  warnings: string[]
  trackAInternalReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  finalDeliveryAllowed: false
  privateReviewOnly: true
  providerAllowed: false
  revideoAllowed: false
  trackBAllowed: false
}

export interface TrackAVisualReadinessIamPlan {
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

export interface TrackAVisualReadinessCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}
