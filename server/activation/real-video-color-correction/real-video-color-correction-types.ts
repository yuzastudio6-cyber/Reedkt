import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'

export type RealVideoColorCorrectionStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type RealVideoColorCorrectionDecision = 'no_op' | 'minimal_correction' | 'blocked'

export interface RealVideoColorCorrectionConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  phase30RunId: 'phase30-20260528T12421'
  phase31RunId: 'phase31-20260528T13060'
  inputBucket: 'reeditpro-staging-reeditpro-final-exports'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  phase31Prefix: string
  phase32Prefix: string
  inputGcsUri: string
  expectedInputDurationSeconds: 15.467
}

export interface RealVideoColorArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoColorSample {
  sampleId: string
  timestampSeconds: number
  stats: Record<string, number>
}

export interface RealVideoColorAnalysisSummary {
  durationSeconds?: number
  sampledFrameCount: number
  colorSpaceAssumption: string
  transferAssumption: string
  underexposedRisk: 'low' | 'warning' | 'high'
  overexposedRisk: 'low' | 'warning' | 'high'
  highlightClippingRisk: 'low' | 'warning' | 'high'
  shadowCrushingRisk: 'low' | 'warning' | 'high'
  saturationRisk: 'low' | 'warning' | 'high'
  whiteBalanceIssue: 'not_detected' | 'warning' | 'unknown'
  skinToneRisk: 'warning_only_not_measured'
  shotMismatch: 'not_applicable_single_clip'
  missingEvidenceWarnings: string[]
}

export interface RealVideoColorGradeRecipe {
  decision: RealVideoColorCorrectionDecision
  reason: string
  ffmpegFilter?: string
  parameters: {
    brightness: number
    contrast: number
    saturation: number
    gamma: number
  }
  correctionStrength: 'none' | 'minimal'
  colorGradeStyle: 'clean_natural'
}

export interface RealVideoColorCorrectionPlan {
  planId: string
  sourcePhase31RunId: string
  inputGcsUri: string
  operations: Array<'ffprobe_stream_inspection' | 'ffmpeg_signalstats_sampling' | 'ffmpeg_clean_color_export'>
  output: {
    colorAnalysisGcsUri: string
    colorGradeRecipeGcsUri: string
    colorCorrectedExportGcsUri: string
  }
  safety: {
    approvedPhase31InputOnly: true
    sourceOverwriteAllowed: false
    publicDeliveryAllowed: false
    providerExecutionAllowed: false
    gpuAllowed: false
    modelDownloadAllowed: false
    openColorIoAllowed: false
    openImageIoAllowed: false
    arbitraryFfmpegArgsAllowed: false
    unapprovedLutsAllowed: false
  }
}

export interface RealVideoColorRuntimeReport {
  ok: boolean
  runId: string
  sourcePhase28RunId: string
  sourcePhase29RunId: string
  sourcePhase30RunId: string
  sourcePhase31RunId: string
  inputColorSourceObject: string
  inputProbe: {
    durationSeconds?: number
    videoCodec?: string
    audioCodec?: string
    width?: number
    height?: number
    hasAudio: boolean
    colorSpace?: string
    colorTransfer?: string
  }
  outputProbe?: {
    durationSeconds?: number
    videoCodec?: string
    audioCodec?: string
    width?: number
    height?: number
    hasAudio: boolean
    colorSpace?: string
    colorTransfer?: string
  }
  colorAnalysis: RealVideoColorAnalysisSummary
  colorGradeRecipe: RealVideoColorGradeRecipe
  colorCorrectedExport?: RealVideoColorArtifact
  artifacts: RealVideoColorArtifact[]
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: QualityGateResult[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    approvedPhase31InputOnly: true
    secondSourceVideoUsed: false
    providerExecuted: false
    gpuUsed: false
    modelDownloadedExternally: false
    openColorIoUsed: false
    openImageIoUsed: false
    arbitraryFfmpegArgsUsed: false
    unapprovedLutUsed: false
    audioCleanupRerun: false
    secretValuesUsed: false
    publicAccessEnabled: false
    sourceOverwritten: false
    masksOrEnhancementExecuted: false
    revideoUsed: false
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoColorCorrectionReport {
  reportId: string
  createdAt: string
  config: RealVideoColorCorrectionConfig
  runtimeReport?: RealVideoColorRuntimeReport
  status: RealVideoColorCorrectionStatus
  blockers: string[]
  warnings: string[]
  phase33Readiness: {
    readyForControlledReview: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
