export type FilmApprovalReportStatus = 'approval_review_complete' | 'blocked_pending_evidence' | 'blocked_all'
export type FilmStagingPlanningDecision = 'staging_planning_approved' | 'pending_evidence' | 'blocked'
export type FilmRiskSeverity = 'blocker' | 'warning'

export interface FilmSourceEvidenceRecord {
  evidenceId: string
  sourceName: string
  sourceUrl: string
  sourceType: 'github' | 'project_page' | 'paper' | 'license' | 'checkpoint_readme'
  evidenceSummary: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface FilmCheckpointCandidate {
  candidateId: string
  displayName: string
  sourceUrl: string
  sourceDescription: string
  modelPath: string
  checksumStatus: 'unavailable_until_phase38b'
  currentStatus: 'recommended_phase38b_candidate' | 'evaluated_candidate'
  notes: string[]
}

export interface FilmModelEvidence {
  toolFamily: 'FILM / frame interpolation / slow motion'
  intendedCapability: 'selected-clip slow-motion / intermediate frame synthesis'
  upstreamRepo: string
  projectPage: string
  paperTitle: 'FILM: Frame Interpolation for Large Motion'
  repoArchivedReadOnly: true
  sourceEvidence: FilmSourceEvidenceRecord[]
  checkpointCandidates: FilmCheckpointCandidate[]
  noWeightsDownloaded: true
  noRuntimeExecuted: true
  noMediaProcessed: true
}

export interface FilmLicenseReview {
  licenseIdentified: boolean
  licenseName: 'Apache-2.0'
  officialSourceUrl: string
  checkpointSourceUrl: string
  commercialUseAllowed: true | false | 'unknown'
  redistributionAllowed: true | false | 'unknown'
  checkpointUseAllowed: true | false | 'unknown'
  requiresHumanLegalReview: boolean
  codexDecision: FilmStagingPlanningDecision
  decisionReason: string
}

export interface FilmRiskRegisterItem {
  riskId: string
  severity: FilmRiskSeverity
  currentStatus: string
  mitigation: string
  evidenceRequiredToClear: string
}

export interface FilmFuturePhaseScope {
  phase: '38B' | '38C' | '38D' | '38E'
  name: string
  allowedOnlyAfter: string[]
  scope: string[]
  stillBlocked: string[]
}

export interface FilmFutureScope {
  phaseSequence: FilmFuturePhaseScope[]
  filmPlanningAllowed: true
  filmDownloadAllowed: false
  filmRuntimeAllowed: false
  slowMotionAllowed: false
  realVideoSlowMotionAllowed: false
  fullVideoInterpolationAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}

export interface FilmCommandPlan {
  commandId: string
  futurePhase: '38B' | '38C' | '38D' | '38E'
  description: string
  commandText: string
  executableCommand: null
  requiresApproval: boolean
  textOnlyByDefault: true
  allowedInPhase38A: false
  blockedReason: string
}

export interface FilmPhase38BReadiness {
  ready: boolean
  nextPhase: 'Phase 38B FILM download/load'
  reason: string
  criteria: string[]
  blockers: string[]
}

export interface FilmApprovalReport {
  phase: '38A'
  reportId: 'activation-phase-38a-film-slowmotion-approval'
  createdAt: string
  track: 'A visual/video'
  status: FilmApprovalReportStatus
  modelEvidence: FilmModelEvidence
  licenseReview: FilmLicenseReview
  stagingPlanningDecision: FilmStagingPlanningDecision
  recommendedPhase38BArtifact: FilmCheckpointCandidate
  riskRegister: FilmRiskRegisterItem[]
  futureScope: FilmFutureScope
  commandPlans: FilmCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase38BReadiness: FilmPhase38BReadiness
  filmPlanningAllowed: true
  filmDownloadAllowed: false
  filmRuntimeAllowed: false
  slowMotionAllowed: false
  realVideoSlowMotionAllowed: false
  fullVideoInterpolationAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
