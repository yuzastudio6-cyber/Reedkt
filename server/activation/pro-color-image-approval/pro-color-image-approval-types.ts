export type ProColorImageApprovalStatus = 'approval_review_complete' | 'blocked_pending_evidence' | 'blocked_all'
export type ProColorImagePlanningDecision = 'staging_planning_approved' | 'pending_evidence' | 'blocked'
export type ProColorToolId = 'opencolorio' | 'openimageio' | 'kornia'
export type ProColorRiskSeverity = 'blocker' | 'warning'

export interface ProColorImageSourceEvidenceRecord {
  evidenceId: string
  toolId: ProColorToolId
  sourceName: string
  sourceUrl: string
  sourceType: 'github' | 'readme' | 'license' | 'package_docs'
  evidenceSummary: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface ProColorImageToolEvidence {
  toolId: ProColorToolId
  displayName: string
  toolFamily: string
  intendedCapability: string
  upstreamRepo: string
  officialReadmeUrl: string
  officialLicenseUrl: string
  licenseName: 'BSD-3-Clause' | 'Apache-2.0'
  recommendedPhase40Role: string
  sourceEvidence: ProColorImageSourceEvidenceRecord[]
  noInstallPerformed: true
  noRuntimeExecuted: true
  noMediaProcessed: true
}

export interface ProColorImageLicenseReview {
  toolId: ProColorToolId
  licenseIdentified: boolean
  licenseName: 'BSD-3-Clause' | 'Apache-2.0'
  officialLicenseUrl: string
  commercialUseAllowed: true | false | 'unknown'
  redistributionAllowed: true | false | 'unknown'
  runtimeUseAllowed: true | false | 'unknown'
  requiresHumanLegalReview: boolean
  codexDecision: ProColorImagePlanningDecision
  decisionReason: string
}

export interface ProColorImageToolScopeOwner {
  scopeId: string
  ownerTool: ProColorToolId | 'ffmpeg_ffprobe'
  owns: string[]
  explicitlyDoesNotOwn: string[]
  phase40AStatus: 'planning_only' | 'existing_scope_preserved'
}

export interface ProColorImageRiskRegisterItem {
  riskId: string
  severity: ProColorRiskSeverity
  currentStatus: string
  mitigation: string
  evidenceRequiredToClear: string
}

export interface ProColorImageFuturePhaseScope {
  phase: '40B' | '40C' | '40D'
  name: string
  allowedOnlyAfter: string[]
  scope: string[]
  stillBlocked: string[]
}

export interface ProColorImageFutureScope {
  phaseSequence: ProColorImageFuturePhaseScope[]
  proColorImagePlanningAllowed: true
  openColorIOPlanningAllowed: true
  openImageIOPlanningAllowed: true
  korniaPlanningAllowed: true
  runtimeInstallAllowed: false
  proColorImageRuntimeAllowed: false
  generatedFixtureRuntimeAllowed: false
  realVideoProColorAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}

export interface ProColorImageCommandPlan {
  commandId: string
  futurePhase: '40B' | '40C' | '40D'
  description: string
  commandText: string
  executableCommand: null
  requiresApproval: boolean
  textOnlyByDefault: true
  allowedInPhase40A: false
  blockedReason: string
}

export interface ProColorImagePhase40BReadiness {
  ready: boolean
  nextPhase: 'Phase 40B generated-fixture pro color/image runtime verification'
  reason: string
  criteria: string[]
  blockers: string[]
}

export interface ProColorImageApprovalReport {
  phase: '40A'
  reportId: 'activation-phase-40a-pro-color-image-approval'
  createdAt: string
  track: 'A visual/video'
  status: ProColorImageApprovalStatus
  baseBranch: string
  preferredBaseUnavailable: boolean
  planningDecision: ProColorImagePlanningDecision
  toolEvidence: ProColorImageToolEvidence[]
  licenseReviews: ProColorImageLicenseReview[]
  toolScopeOwnership: ProColorImageToolScopeOwner[]
  riskRegister: ProColorImageRiskRegisterItem[]
  futureScope: ProColorImageFutureScope
  commandPlans: ProColorImageCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase40BReadiness: ProColorImagePhase40BReadiness
  proColorImagePlanningAllowed: true
  openColorIOPlanningAllowed: true
  openImageIOPlanningAllowed: true
  korniaPlanningAllowed: true
  runtimeInstallAllowed: false
  proColorImageRuntimeAllowed: false
  generatedFixtureRuntimeAllowed: false
  realVideoProColorAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
