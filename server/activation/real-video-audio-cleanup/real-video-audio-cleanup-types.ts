import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'

export type RealVideoAudioCleanupStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export interface RealVideoAudioCleanupConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  phase30RunId: 'phase30-20260528T12421'
  inputBucket: 'reeditpro-staging-reeditpro-final-exports'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  phase30Prefix: string
  phase31Prefix: string
  inputGcsUri: string
  expectedInputDurationSeconds: 15.47
  targetIntegratedLufs: -16
  targetTruePeakDbtp: -1.5
  targetLra: 11
}

export interface RealVideoAudioCleanupArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoLoudnessStats {
  integratedLufs?: number
  truePeakDbtp?: number
  loudnessRange?: number
  threshold?: number
  targetOffset?: number
  raw: Record<string, unknown>
}

export interface RealVideoAudioCleanupPlan {
  planId: string
  sourcePhase30RunId: string
  inputGcsUri: string
  operations: Array<'ffprobe_stream_inspection' | 'ffmpeg_loudnorm_measurement' | 'ffmpeg_loudnorm_normalization' | 'ffmpeg_mux_normalized_audio'>
  targets: {
    integratedLufs: -16
    truePeakDbtp: -1.5
    loudnessRange: 11
  }
  output: {
    cleanedAudioGcsUri: string
    normalizedExportGcsUri: string
  }
  safety: {
    approvedPhase30InputOnly: true
    sourceOverwriteAllowed: false
    publicDeliveryAllowed: false
    providerExecutionAllowed: false
    gpuAllowed: false
    modelDownloadAllowed: false
    deepFilterNetAllowed: false
    rnnoiseAllowed: false
    demucsAllowed: false
  }
}

export interface RealVideoAudioCleanupRuntimeReport {
  ok: boolean
  runId: string
  sourcePhase28RunId: string
  sourcePhase29RunId: string
  sourcePhase30RunId: string
  inputFinalExportObject: string
  inputProbe: {
    durationSeconds?: number
    videoCodec?: string
    audioCodec?: string
    hasAudio: boolean
  }
  outputProbe?: {
    durationSeconds?: number
    videoCodec?: string
    audioCodec?: string
    hasAudio: boolean
  }
  loudnessBefore?: RealVideoLoudnessStats
  loudnessAfter?: RealVideoLoudnessStats
  normalizedAudio?: RealVideoAudioCleanupArtifact
  normalizedExport?: RealVideoAudioCleanupArtifact
  artifacts: RealVideoAudioCleanupArtifact[]
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: QualityGateResult[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    approvedPhase30InputOnly: true
    secondSourceVideoUsed: false
    providerExecuted: false
    gpuUsed: false
    modelDownloadedExternally: false
    deepFilterNetUsed: false
    rnnoiseUsed: false
    demucsUsed: false
    secretValuesUsed: false
    publicAccessEnabled: false
    sourceOverwritten: false
    colorExecuted: false
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

export interface RealVideoAudioCleanupReport {
  reportId: string
  createdAt: string
  config: RealVideoAudioCleanupConfig
  runtimeReport?: RealVideoAudioCleanupRuntimeReport
  status: RealVideoAudioCleanupStatus
  blockers: string[]
  warnings: string[]
  phase32Readiness: {
    readyForControlledReview: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
