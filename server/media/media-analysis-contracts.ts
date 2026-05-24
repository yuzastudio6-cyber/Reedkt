import type { MediaProbeSummary } from './ffprobe'

export type { MediaProbeSummary } from './ffprobe'

export type MediaAnalysisCanaryStatus = 'passed' | 'failed' | 'skipped'

export interface MediaAnalysisCanaryRequest {
  canary: true
  mode: 'staging_media_analysis_canary'
  smokeRunId: string
  stagingOnly: true
  allowWrites: boolean
  allowMediaAnalysis: boolean
  cleanup: boolean
  maxWaitSeconds: number
}

export interface FrameSampleArtifact {
  bucketName: string
  objectPath: string
  mimeType: string
  sizeBytes: number
  checksumSha256: string
  width?: number
  height?: number
  smokeTraceable: boolean
}

export interface AudioStreamSummary {
  checkedWithFfmpeg: boolean
  hasAudio: boolean
  codec?: string
  summary: string
}

export interface OptionalAnalysisReadiness {
  toolId: 'pyscenedetect' | 'whisper' | 'opencv' | 'audioflux'
  status: 'passed' | 'warning' | 'missing' | 'failed' | 'blocked'
  enabled: false
  required: false
  summary: string
}

export interface MediaAnalysisSafetyFlags {
  stagingOnly: true
  noProductionFlowsRan: true
  noStripePaymentFlowsRan: true
  noExternalProviderGenerationCallsRan: true
  noCustomerMediaUsed: true
  noBroadE2eSuiteRan: true
  noQueueDrainRan: true
  noServiceAccountJsonKeyUsed: true
  signedUrlsStoredAsCanonicalTruth: false
}

export interface MediaAnalysisReport {
  smokeRunId: string
  source: {
    bucketName: string
    objectPath: string
    mimeType: 'video/mp4'
    sizeBytes: number
    checksumSha256: string
  }
  probe: MediaProbeSummary
  thumbnail: FrameSampleArtifact
  audio: AudioStreamSummary
  optionalReadiness: OptionalAnalysisReadiness[]
  safety: MediaAnalysisSafetyFlags
}

export interface MediaAnalysisCanaryResult {
  ok: boolean
  status: MediaAnalysisCanaryStatus
  smokeRunId?: string
  sourceArtifact?: {
    bucketName: string
    objectPath: string
    sizeBytes?: number
    checksumSha256?: string
  }
  analysisArtifacts: FrameSampleArtifact[]
  mediaProbe?: MediaProbeSummary
  audioSummary?: AudioStreamSummary
  optionalReadiness: OptionalAnalysisReadiness[]
  report?: MediaAnalysisReport
  cleanup?: {
    attempted: boolean
    deleted: Array<{ table: string; id: string }>
    errors: string[]
    warnings?: string[]
  }
  gcsCleanup: {
    attempted: boolean
    deleted: Array<{ bucketName: string; objectPath: string }>
    errors: string[]
    warnings?: string[]
  }
  leftoverRecords?: Array<{ table: string; id: string; matchedBy: string }>
  leftoverQueryErrors?: string[]
  strictValidation: {
    ok: boolean
    blockers: string[]
    cleanupDeletedCount: number
    gcsCleanupDeletedCount: number
    safety: MediaAnalysisSafetyFlags
  }
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}
