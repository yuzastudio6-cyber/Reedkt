import type { OcrModelAssetVerificationEntry, OcrRuntimeArtifact } from '../ocr-runtime'
import type {
  ControlledRealVideoCaptionZone,
  ControlledRealVideoOcrSafeZoneConfig,
  ControlledRealVideoOcrSafeZoneQaStatus,
  ControlledRealVideoSampleCandidate,
} from './controlled-real-video-ocr-safe-zone-types'

export type ControlledRealVideoOcrExecutionStatus = 'not_started' | 'passed' | 'blocked' | 'failed'

export type ControlledRealVideoOcrExecutionMode = 'controlled_real_video_safe_zone_execution'

export interface ControlledRealVideoOcrExecutionEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  sourceGcsUri?: string
  ocrExecuteConfirmation?: string
  frameExtractionConfirmation?: string
  artifactUploadConfirmation?: string
  privateGcsReadConfirmation?: string
  runtimeExecuteConfirmation?: string
  arbitraryMediaEnabled?: string
  broadRealMediaReady?: string
  providerExecutionEnabled?: string
  publicOutputEnabled?: string
  signedUrlSourceOfTruthEnabled?: string
  trackAExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
}

export interface ControlledRealVideoOcrExecutionValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoGcsObjectMetadata {
  gcsUri: string
  bucket: string
  object: string
  sizeBytes: number
  generation?: string
  crc32c?: string
  md5Hash?: string
  contentType?: string
  updated?: string
}

export interface ControlledRealVideoLocalSourceCopy {
  gcs: ControlledRealVideoGcsObjectMetadata
  localPath: string
  sizeBytes: number
  expectedSha256: string
  actualSha256: string
  verified: boolean
}

export interface ControlledRealVideoFrameExtractionEntry {
  frameId: string
  offsetSeconds: number
  localFramePath: string
  extracted: boolean
  width: number
  height: number
  sourceTimeMsec: number
  warnings: string[]
}

export interface ControlledRealVideoFrameExtractionManifest {
  phase: '37D'
  runId: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  controlledChainId: ControlledRealVideoOcrSafeZoneConfig['selectedChainId']
  sourceGcsUri: string
  window: ControlledRealVideoSampleCandidate['plannedWindow']
  requestedOffsetsSeconds: number[]
  extractedFrameCount: number
  maxSampledFrames: 6
  frameExtractionEngine: 'opencv'
  ffmpegUnavailableExpected: true
  frames: ControlledRealVideoFrameExtractionEntry[]
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoOcrTextRegion {
  regionId: string
  frameId: string
  text: string
  confidence?: number
  polygon: Array<[number, number]>
  normalizedPolygon: Array<[number, number]>
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  center: [number, number]
}

export interface ControlledRealVideoOcrFrameResult {
  frameId: string
  offsetSeconds: number
  width: number
  height: number
  textRegions: ControlledRealVideoOcrTextRegion[]
  textRegionCount: number
  averageConfidence?: number
  warnings: string[]
  blockers: string[]
}

export interface ControlledRealVideoOcrResults {
  phase: '37D'
  runId: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  frameResults: ControlledRealVideoOcrFrameResult[]
  totalTextRegionCount: number
  framesWithTextCount: number
  runtime: {
    mode: ControlledRealVideoOcrExecutionMode
    cpuOnly: true
    paddleOcrImported: boolean
    paddlePaddleImported: boolean
    paddleOcrVersion?: string
    paddlePaddleVersion?: string
    exitCode: number
    stderrPreview: string
    networkBlocked: boolean
    runtimeModelAutoDownloadBlocked: boolean
    localModelPathsUsed: boolean
    dictionaryPathUsed: boolean
    frameExtractionEngine: 'opencv'
  }
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoAvoidTextRegion {
  avoidRegionId: string
  sourceRegionId: string
  frameId: string
  x: number
  y: number
  width: number
  height: number
  padding: 0.025
}

export interface ControlledRealVideoCaptionCandidateZone extends ControlledRealVideoCaptionZone {
  candidatePriority: number
}

export interface ControlledRealVideoCaptionCollisionEntry {
  frameId: string
  offsetSeconds: number
  lowerThirdCollision: boolean
  lowerThirdOverlapScore: number
  textRegionCount: number
  recommendedZoneId: string
  recommendationStatus: ControlledRealVideoOcrSafeZoneQaStatus
  candidateZones: Array<{
    zoneId: string
    intersectsText: boolean
    overlapScore: number
  }>
  avoidRegions: ControlledRealVideoAvoidTextRegion[]
  warnings: string[]
  blockers: string[]
}

export interface ControlledRealVideoOcrSafeZoneManifest {
  phase: '37D'
  runId: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  captionCandidateZones: ControlledRealVideoCaptionCandidateZone[]
  avoidTextRegions: ControlledRealVideoAvoidTextRegion[]
  frameRecommendations: ControlledRealVideoCaptionCollisionEntry[]
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoCaptionCollisionReport {
  phase: '37D'
  runId: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  expectedLowerCaptionZone: ControlledRealVideoCaptionZone
  framesChecked: number
  framesWithLowerThirdCollision: number
  framesWithoutText: number
  recommendationsAvailable: number
  entries: ControlledRealVideoCaptionCollisionEntry[]
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoSafeZoneRecommendationReport {
  phase: '37D'
  runId: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  status: ControlledRealVideoOcrSafeZoneQaStatus
  recommendedForPhase37EPlanning: boolean
  summary: {
    sampledFrames: number
    totalTextRegionCount: number
    framesWithLowerThirdCollision: number
    framesWithoutText: number
    preferredCaptionZoneIds: string[]
  }
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoOcrModelVerificationReport {
  phase: '37D'
  runId: string
  modelGcsPath: string
  aggregateSha256: string
  entries: OcrModelAssetVerificationEntry[]
  status: 'verified' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoPrivateArtifactManifest {
  phase: '37D'
  runId: string
  privateOnly: true
  bucket: ControlledRealVideoOcrSafeZoneConfig['qaBucket']
  prefix: string
  artifactCount: number
  jsonOnly: true
  rawFramesUploaded: false
  overlaysUploaded: false
  artifacts: OcrRuntimeArtifact[]
  uploadedArtifacts: ControlledRealVideoGcsObjectMetadata[]
  blocked: {
    publicAccess: true
    signedUrls: true
    rawFrameUpload: true
    overlayUpload: true
    arbitraryMedia: true
    phase37EIntegration: true
    beta: true
    production: true
  }
}

export interface ControlledRealVideoOcrExecutionReport {
  ok: boolean
  phase: '37D'
  runId: string
  projectId: 'reeditpro'
  status: ControlledRealVideoOcrExecutionStatus
  sample: {
    sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
    controlledChainId: ControlledRealVideoOcrSafeZoneConfig['selectedChainId']
    sourceGcsUri: string
    window: ControlledRealVideoSampleCandidate['plannedWindow']
    frameOffsetsSeconds: number[]
    frameCount: number
  }
  source: ControlledRealVideoLocalSourceCopy
  modelVerification: ControlledRealVideoOcrModelVerificationReport
  frameExtraction: ControlledRealVideoFrameExtractionManifest
  ocrResults: ControlledRealVideoOcrResults
  safeZoneManifest: ControlledRealVideoOcrSafeZoneManifest
  collisionReport: ControlledRealVideoCaptionCollisionReport
  recommendationReport: ControlledRealVideoSafeZoneRecommendationReport
  qa: {
    status: ControlledRealVideoOcrSafeZoneQaStatus
    gates: Array<{
      gateId:
        | 'approved_private_sample'
        | 'source_object_metadata'
        | 'frame_extraction_bounds'
        | 'phase37b_model_checksums'
        | 'paddleocr_runtime'
        | 'safe_zone_collision_report'
        | 'private_json_artifacts'
        | 'blocked_scopes'
      status: ControlledRealVideoOcrSafeZoneQaStatus
      summary: string
    }>
    blockers: string[]
    warnings: string[]
  }
  artifacts: ControlledRealVideoGcsObjectMetadata[]
  safety: {
    controlledRealVideoOnly: true
    arbitraryMediaUsed: false
    broadRealVideoOcrUsed: false
    rawFramesUploaded: false
    overlaysUploaded: false
    captionRenderIntegrationPerformed: false
    iamMutated: false
    dockerBuilt: false
    cloudRunDeployed: false
    providerExecuted: false
    publicAccessEnabled: false
    signedUrlSourceOfTruthUsed: false
    gpuJobUsed: false
    trackATouched: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
  }
  phase37EReadiness: {
    readyForControlledCaptionRenderQaPlanning: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedControlledRealVideoOcrExecutionEvidence {
  phase: '37D'
  status: ControlledRealVideoOcrExecutionStatus
  runId?: string
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  controlledChainId: ControlledRealVideoOcrSafeZoneConfig['selectedChainId']
  sourceGcsUri: string
  window: ControlledRealVideoSampleCandidate['plannedWindow']
  frameOffsetsSeconds: number[]
  frameCount: number
  artifactPrefix?: string
  privateArtifactObjectCount: number
  sourceObject?: ControlledRealVideoGcsObjectMetadata
  modelAggregateSha256: string
  modelAssetSha256: {
    detection: string
    recognition: string
    dictionary: string
  }
  ocrSummary: {
    totalTextRegionCount: number
    framesWithTextCount: number
    framesWithoutText: number
    framesWithLowerThirdCollision: number
    recommendationsAvailable: number
    averageRegionsPerFrame: number
  }
  phase37EReadiness: {
    readyForControlledCaptionRenderQaPlanning: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoOcrExecutionResult {
  evidence: ApprovedControlledRealVideoOcrExecutionEvidence
  executionReport: ControlledRealVideoOcrExecutionReport
  localReportPath: string
  localArtifactDir: string
  uploadedArtifacts: ControlledRealVideoGcsObjectMetadata[]
}
