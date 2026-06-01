export type AudioAiToolId = 'deepfilternet' | 'rnnoise' | 'demucs'
export type AudioAiPlanningRecommendation = 'deepfilternet_first' | 'rnnoise_first' | 'blocked'
export type AudioAiApprovalReportStatus = 'approval_review_complete' | 'blocked_missing_artifact_evidence' | 'blocked_license_provenance'
export type AudioAiApprovalDecision = 'staging_planning_recommended' | 'blocked_missing_artifact_evidence' | 'blocked_license_provenance'
export type AudioAiRiskSeverity = 'blocker' | 'warning'
export type AudioAiToolRole = 'primary_speech_enhancement_candidate' | 'lightweight_fallback_candidate' | 'restricted_source_separation_candidate'
export type AudioAiToolStatus = 'planning_recommended' | 'fallback_planning_only' | 'restricted_deferred'

export interface AudioAiSourceEvidence {
  evidenceId: string
  toolId: AudioAiToolId
  sourceName: string
  sourceUrl: string
  licenseClaim: string
  provenanceClaim: string
  commercialUseClaim: true | false | 'unknown'
  redistributionClaim: true | false | 'unknown'
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface AudioAiToolEvidence {
  toolId: AudioAiToolId
  toolName: string
  role: AudioAiToolRole
  currentStatus: AudioAiToolStatus
  intendedCapability: string
  officialRepoUrl: string
  licenseName: string
  licenseEvidenceSummary: string
  modelOrArtifactEvidenceStatus: 'artifact_source_not_selected' | 'build_time_model_download_risk' | 'pretrained_model_provenance_needs_review'
  approvedArtifactSource: string | null
  approvedChecksum: string | null
  approvedStoragePath: string | null
  approvalBlockers: string[]
  sourceEvidence: AudioAiSourceEvidence[]
}

export interface AudioAiEvidenceReview {
  currentState: 'approval_review_only'
  tools: AudioAiToolEvidence[]
  noModelWeightsDownloaded: true
  noRuntimeExecuted: true
  noAudioProcessed: true
  provenAudioBaseline: {
    phase: '31'
    runId: 'phase31-20260528T13060'
    summary: string
    privateExportGcsUri: string
  }
}

export interface AudioAiLicenseReview {
  toolId: AudioAiToolId
  licenseIdentified: boolean
  licenseName: string
  commercialUseAllowed: true | false | 'unknown'
  redistributionAllowed: true | false | 'unknown'
  modelArtifactUseAllowed: true | false | 'unknown'
  requiresHumanLegalReview: boolean
  codexReviewDecision: AudioAiApprovalDecision
  currentStatus: string
  evidenceRequired: string[]
}

export interface AudioAiRiskRegisterItem {
  riskId: string
  severity: AudioAiRiskSeverity
  currentStatus: string
  mitigation: string
  evidenceRequiredToClear: string
}

export interface AudioAiFuturePhaseScope {
  phase: '36B' | '36C' | '36D' | '36E'
  name: string
  allowedOnlyAfter: string[]
  scope: string[]
  stillBlocked: string[]
}

export interface AudioAiFutureScope {
  phaseSequence: AudioAiFuturePhaseScope[]
  audioAiPlanningRecommendation: AudioAiPlanningRecommendation
  deepFilterNetPlanningAllowed: boolean
  rnnoiseFallbackPlanningAllowed: boolean
  demucsRestrictedPlanningAllowed: boolean
  audioAiDownloadAllowed: false
  audioAiRuntimeAllowed: false
  realVideoAudioAiCleanupAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}

export interface AudioAiCommandPlan {
  commandId: string
  futurePhase: '36B' | '36C' | '36D' | '36E'
  description: string
  commandText: string
  executableCommand: null
  requiresHumanApproval: true
  textOnlyByDefault: true
  allowedInPhase36A: false
  blockedReason: string
}

export interface AudioAiReadiness {
  ready: boolean
  nextPhase: 'Phase 36B audio AI download/load'
  status: 'blocked_missing_artifact_evidence'
  blockers: string[]
  criteria: string[]
}

export interface AudioAiApprovalReport {
  phase: '36A'
  reportId: 'activation-phase-36a-audio-ai-approval'
  createdAt: string
  status: AudioAiApprovalReportStatus
  approvalDecision: AudioAiApprovalDecision
  evidenceReview: AudioAiEvidenceReview
  licenseReviews: AudioAiLicenseReview[]
  riskRegister: AudioAiRiskRegisterItem[]
  futureScope: AudioAiFutureScope
  commandPlans: AudioAiCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase36BReadiness: AudioAiReadiness
  audioAiDownloadAllowed: false
  audioAiRuntimeAllowed: false
  realVideoAudioAiCleanupAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
