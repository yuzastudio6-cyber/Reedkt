export type FilmSlowMotionReviewStatus = 'blocked_for_execution' | 'review_complete'

export type FilmSlowMotionModelStatus = 'evaluated-only'

export type FilmSlowMotionRiskSeverity = 'blocker' | 'warning'

export type FilmSlowMotionRiskStatus =
  | 'blocked_until_human_approval'
  | 'warning_after_future_runtime_proof'

export type FilmSlowMotionFutureCommandCategory =
  | 'future_model_approval'
  | 'future_model_download'
  | 'future_checksum_verification'
  | 'future_runtime_image_build'
  | 'future_cloud_run_l4_job_deployment'
  | 'future_one_short_clip_test'
  | 'future_qa_review'

export interface Phase34DEnhancementSampleReference {
  phase: '34D'
  runId: string
  sourcePhase33DRunId: string
  sourceFrameGcsUri: string
  sourceFrameDimensions: {
    width: number
    height: number
  }
  sampleCrop: {
    x: number
    y: number
    width: number
    height: number
  }
  enhancedOutputDimensions: {
    width: number
    height: number
  }
  model: 'RealESRGAN_x4plus'
  boundedSampleOnly: true
  fullFrameEnhancementAllowed: false
  fullVideoEnhancementAllowed: false
  humanBeforeAfterReviewRequired: true
}

export interface FilmSlowMotionModelEvidence {
  toolName: 'FILM / frame interpolation'
  likelyUpstream: 'google-research/frame-interpolation'
  intendedCapability: 'selected-clip frame interpolation / slow-motion'
  currentStatus: FilmSlowMotionModelStatus
  filmApproved: false
  checkpointApproved: false
  approvedChecksumRecorded: false
  approvedStoragePathRecorded: false
  approvedRuntimeImageOrJob: false
  downloadAllowed: false
  runtimeAllowed: false
  slowMotionAllowed: false
  productionAllowed: false
  externalBetaAllowed: false
  broadRealMediaAllowed: false
  blockers: string[]
  futureApprovalRequirements: string[]
}

export interface FilmSlowMotionPolicyGates {
  phase: '34E'
  gcpProjectId: 'reeditpro'
  gcpRegion: 'us-central1'
  reeditproEnv: 'staging'
  filmStatus: FilmSlowMotionModelStatus
  slowMotionAllowed: false
  filmDownloadAllowed: false
  filmRuntimeAllowed: false
  slowMotionExecutionAllowed: false
  fullVideoInterpolationAllowed: false
  fullFrameEnhancementAllowed: false
  fullVideoEnhancementAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  providersAllowed: false
  revideoAllowed: false
  modelApprovalRequired: true
  checkpointApprovalRequired: true
  licenseReviewRequired: true
  checksumRequired: true
  privateStorageRequired: true
  futureBoundedClipTestRequired: true
  humanVisualReviewRequired: true
}

export interface FilmSlowMotionRisk {
  riskId: string
  severity: FilmSlowMotionRiskSeverity
  mitigation: string
  requiredEvidence: string
  currentStatus: FilmSlowMotionRiskStatus
}

export interface FilmSlowMotionFutureTestScope {
  proposedPhase: '34F'
  status: 'blocked_until_human_approval'
  clipCountLimit: 1
  maxDurationSeconds: 2
  explicitlyApprovedShortClipOnly: true
  noFullVideoInterpolation: true
  noEntire4kVideoProcessing: true
  noArbitraryUserMedia: true
  noAudioRewriteUnlessExplicitlyPlanned: true
  exactModelCheckpointRequired: true
  checksumRequired: true
  privateGcsArtifactsOnly: true
  qaRequiredForMotionArtifacts: true
  qaRequiredForSync: true
  qaRequiredForFlicker: true
  qaRequiredForSubjectDeformation: true
  humanVisualReviewBeforeBroaderUse: true
  filmDownloadAllowed: false
  filmRuntimeAllowed: false
  slowMotionExecutionAllowed: false
  fullVideoInterpolationAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}

export interface FilmSlowMotionFutureCommandPlan {
  planId: string
  category: FilmSlowMotionFutureCommandCategory
  description: string
  requiresHumanApproval: true
  textOnlyByDefault: true
  allowedInPhase34E: false
  executableCommand: null
  blockedReason: string
}

export interface FilmSlowMotionReviewReport {
  phase: '34E'
  status: FilmSlowMotionReviewStatus
  base: string
  patchType: 'non-mutating FILM/slow-motion review gate'
  phase34DReference: Phase34DEnhancementSampleReference
  policy: FilmSlowMotionPolicyGates
  modelEvidence: FilmSlowMotionModelEvidence
  riskRegister: FilmSlowMotionRisk[]
  futureBoundedTestScope: FilmSlowMotionFutureTestScope
  commandPlans: FilmSlowMotionFutureCommandPlan[]
  blockers: string[]
  warnings: string[]
  futureReadinessCriteria: string[]
  packageLockChangeRequired: false
}
