export type RealEsrganPolicyStatus = 'policy_complete / broader_execution_blocked'
export type RealEsrganRiskSeverity = 'blocker' | 'warning'
export type RealEsrganPlanStatus = 'text_only' | 'blocked_future_phase'

export interface Phase34DArtifactPaths {
  inputSampleGcsUri: string
  enhancedSampleGcsUri: string
  metadataGcsUri: string
  qaGcsUri: string
  reportGcsUri: string
}

export interface RealEsrganPhase34DEvidence {
  phase34DRunId: 'phase34d-20260528T20300'
  sourcePhase33DRunId: 'phase33d-20260528T161056'
  sourceFrameGcsUri: string
  sourceFrameDimensions: {
    width: 2160
    height: 3840
  }
  sampleCrop: {
    x: 824
    y: 1664
    width: 512
    height: 512
  }
  enhancedSample: {
    width: 2048
    height: 2048
  }
  model: {
    name: 'RealESRGAN_x4plus'
    manifestId: 'real_esrgan_x4plus_staging_v1'
    modelFileSha256: string
    aggregateSha256: string
  }
  runtime: {
    jobExecutionId: 'reeditpro-staging-real-esrgan-runtime-job-lpp7v'
    imageTag: 'staging-real-esrgan-sample-001'
    pinnedLinuxAmd64Digest: string
  }
  artifacts: Phase34DArtifactPaths
  qaSummary: {
    status: 'warning'
    blockers: string[]
    warnings: string[]
    warningOnlyRisks: string[]
  }
  safetyConfirmations: {
    exactlyOneBoundedSample: true
    fullFrameEnhanced: false
    fullVideoEnhanced: false
    filmUsed: false
    slowMotionUsed: false
    providerExecuted: false
    publicAccessEnabled: false
    modelDownloadedExternally: false
    gfpganFaceEnhanceRan: false
  }
}

export interface RealEsrganHumanVisualReviewPolicy {
  humanVisualReviewRequired: true
  humanVisualReviewCompleted: boolean
  humanApprovalForFullFrame: boolean
  humanApprovalForFullVideo: boolean
  currentStatus: string
  nextRealEsrganStep: string
  requiredChecks: string[]
}

export interface RealEsrganRiskRegisterItem {
  riskId: string
  severity: RealEsrganRiskSeverity
  currentStatus: string
  mitigation: string
  evidenceRequiredToClear: string
}

export interface RealEsrganFuturePlanningOption {
  optionId: string
  allowedForPlanning: boolean
  requiresSeparateHumanApproval: boolean
  description: string
}

export interface RealEsrganNextSampleScope {
  futurePlanningOptions: RealEsrganFuturePlanningOption[]
  realEsrganAdditionalBoundedSamplePlanningAllowed: true
  realEsrganFullFrameAllowed: false
  realEsrganFullVideoAllowed: false
  blindFullVideoEnhancementAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  slowMotionAllowed: false
  filmAllowed: false
  providerAllowed: false
  publicAccessAllowed: false
  revideoAllowed: false
  constraints: string[]
}

export interface RealEsrganPolicyCommandPlan {
  commandId: string
  status: RealEsrganPlanStatus
  description: string
  commandString: string
  requiresHumanApproval: boolean
  textOnlyByDefault: true
  allowedInPhase34E: boolean
  blockedReason?: string
}

export interface RealEsrganPolicyDecisionReport {
  phase: '34E'
  reportId: 'activation-phase-34e-real-esrgan-policy-decision'
  createdAt: string
  status: RealEsrganPolicyStatus
  phase34DEvidence: RealEsrganPhase34DEvidence
  humanVisualReview: RealEsrganHumanVisualReviewPolicy
  riskRegister: RealEsrganRiskRegisterItem[]
  nextSampleScope: RealEsrganNextSampleScope
  commandPlans: RealEsrganPolicyCommandPlan[]
  decisionSummary: string[]
  allowedNextPlanning: string[]
  blockers: string[]
  warnings: string[]
  phase35AReadiness: {
    ready: true
    nextPhase: 'Phase 35A SAM2 model approval workflow'
    criteria: string[]
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  realEsrganFullFrameAllowed: false
  realEsrganFullVideoAllowed: false
  blindFullVideoEnhancementAllowed: false
  slowMotionAllowed: false
  filmAllowed: false
  providerAllowed: false
  publicAccessAllowed: false
  revideoAllowed: false
}
