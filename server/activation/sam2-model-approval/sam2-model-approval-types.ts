export type Sam2ApprovalDecision = 'pending_human_review' | 'staging_planning_approved' | 'blocked'
export type Sam2ApprovalReportStatus = 'blocked_pending_human_review' | 'approval_review_complete' | 'blocked_missing_evidence'
export type Sam2RiskSeverity = 'blocker' | 'warning'
export type Sam2CandidateApprovalStatus = 'evaluated_only' | 'blocked_pending_human_review'

export interface Sam2EvidenceSource {
  evidenceId: string
  candidateId: string
  sourceName: string
  sourceUrl: string
  licenseClaim: string
  commercialUseClaim: string
  redistributionClaim: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface Sam2ModelCandidateEvidence {
  candidateId: string
  modelName: string
  sourceUrl?: string
  officialGithubUrl?: string
  intendedCapability: string
  currentStatus: Sam2CandidateApprovalStatus
  checkpointProvenance: string
  approvedCheckpointSource: string | null
  approvedChecksum: string | null
  approvedStoragePath: string | null
  approvedRuntimeImage: string | null
  approvalBlockers: string[]
  sourceEvidence: Sam2EvidenceSource[]
}

export interface Sam2ModelEvidence {
  modelFamily: 'SAM2 / Segment Anything Model 2'
  intendedCapability: 'temporal segmentation / video object tracking / mask propagation'
  currentState: 'evaluated_only'
  candidates: Sam2ModelCandidateEvidence[]
  noWeightsDownloaded: true
  noRuntimeExecuted: true
  noTemporalTrackingTested: true
  birefnetOnlyRuntimeProvenSoFar: true
}

export interface Sam2LicenseReview {
  licenseIdentified: boolean
  licenseName: string
  commercialUseAllowed: true | false | 'unknown'
  redistributionAllowed: true | false | 'unknown'
  checkpointUseAllowed: true | false | 'unknown'
  requiresHumanLegalReview: boolean
  humanApprovalRecorded: boolean
  approvalDecision: Sam2ApprovalDecision
  currentStatus: string
  evidenceRequired: string[]
}

export interface Sam2RiskRegisterItem {
  riskId: string
  severity: Sam2RiskSeverity
  currentStatus: string
  mitigation: string
  evidenceRequiredToClear: string
}

export interface Sam2FuturePhaseScope {
  phase: '35B' | '35C' | '35D' | '35E'
  name: string
  allowedOnlyAfter: string[]
  scope: string[]
  stillBlocked: string[]
}

export interface Sam2FutureScope {
  phaseSequence: Sam2FuturePhaseScope[]
  sam2PlanningRecommendationAllowed: boolean
  sam2DownloadAllowed: false
  sam2RuntimeAllowed: false
  sam2TemporalTrackingAllowed: false
  sam2FullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface Sam2CommandPlan {
  commandId: string
  futurePhase: '35B' | '35C' | '35D' | '35E'
  description: string
  commandText: string
  executableCommand: null
  requiresHumanApproval: true
  textOnlyByDefault: true
  allowedInPhase35A: false
  blockedReason: string
}

export interface Sam2Readiness {
  ready: boolean
  nextPhase: 'Phase 35B SAM2 download/load'
  blockers: string[]
  criteria: string[]
}

export interface Sam2ApprovalReport {
  phase: '35A'
  reportId: 'activation-phase-35a-sam2-model-approval'
  createdAt: string
  status: Sam2ApprovalReportStatus
  modelEvidence: Sam2ModelEvidence
  licenseReview: Sam2LicenseReview
  approvalDecision: Sam2ApprovalDecision
  riskRegister: Sam2RiskRegisterItem[]
  futureScope: Sam2FutureScope
  commandPlans: Sam2CommandPlan[]
  blockers: string[]
  warnings: string[]
  phase35BReadiness: Sam2Readiness
  sam2DownloadAllowed: false
  sam2RuntimeAllowed: false
  sam2TemporalTrackingAllowed: false
  sam2FullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}
