import type { ID, ISODateString, JSONObject, Seconds } from '../../types/shared'
import type { ProductionTimeRange, ProductionToolIssue } from './production-tool-runtime-contracts'

export type MediaAnalysisReportStatus =
  | 'pending'
  | 'partial'
  | 'planned'
  | 'running'
  | 'completed'
  | 'skipped'
  | 'failed'
  | 'blocked'
  | 'needs_review'

export interface MediaAnalysisMetadata {
  durationSeconds: Seconds
  width: number
  height: number
  fps: number
  codecName: string
  formatName: string
  rotation: number
  aspectRatio: string
  sizeBytes: number
}

export interface MediaVideoStream {
  streamIndex: number
  codecName: string
  width: number
  height: number
  fps?: number
  durationSeconds?: Seconds
  pixelFormat?: string
  colorSpace?: string
  rotation?: number
  metadata?: JSONObject
}

export interface MediaAudioStream {
  streamIndex: number
  codecName: string
  sampleRate?: number
  channels?: number
  durationSeconds?: Seconds
  loudness?: number
  metadata?: JSONObject
}

export interface MediaProxyInfo {
  proxyArtifactId?: ID
  status: 'not_required' | 'planned' | 'created' | 'failed'
  width?: number
  height?: number
  durationSeconds?: Seconds
  notes?: string
}

export interface MediaKeyframeInfo {
  artifactId: ID
  timeSeconds: Seconds
  frameNumber?: number
  reason: string
  confidence?: number
}

export interface SceneBoundary {
  boundaryId: ID
  startSeconds: Seconds
  endSeconds: Seconds
  startFrame?: number
  endFrame?: number
  confidence: number
  reason?: string
}

export interface TransitionCandidate {
  candidateId: ID
  timeSeconds: Seconds
  frameNumber?: number
  transitionType?: string
  confidence: number
}

export interface SceneAnalysisSummary {
  sceneCount: number
  boundaries: SceneBoundary[]
  transitionCandidates: TransitionCandidate[]
  confidence: number
}

export interface SpeechFillerSegment extends ProductionTimeRange {
  label: string
  confidence: number
}

export interface RepeatedTakeCandidate {
  candidateId: ID
  ranges: ProductionTimeRange[]
  reason: string
  confidence: number
}

export interface SpeechAnalysisSummary {
  speechDetected: boolean
  transcriptArtifactId?: ID
  wordTimestampArtifactId?: ID
  language?: string
  confidence: number
  fillerSegments: SpeechFillerSegment[]
  repeatedTakeCandidates: RepeatedTakeCandidate[]
}

export interface SilenceSegment extends ProductionTimeRange {
  confidence?: number
}

export interface AudioAnalysisSummary {
  noiseLevel?: number
  loudness?: number
  clippingDetected: boolean
  musicDetected: boolean
  musicSpeechOverlap: boolean
  silenceSegments: SilenceSegment[]
  energyCurveArtifactId?: ID
  issues: ProductionToolIssue[]
}

export interface VisualAnalysisSummary {
  blurScoresArtifactId?: ID
  motionCurveArtifactId?: ID
  faceRegionsArtifactId?: ID
  safeZoneReportArtifactId?: ID
  productOrObjectRegionsArtifactId?: ID
  issues: ProductionToolIssue[]
}

export interface ColorAnalysisSummary {
  colorSpaceAssumption?: string
  transferAssumption?: string
  hdrDetected: boolean
  underexposed: boolean
  overexposed: boolean
  whiteBalanceIssue: boolean
  shotMismatch: boolean
  skinToneRisk: boolean
  histogramArtifactId?: ID
  representativeFramesArtifactId?: ID
  issues: ProductionToolIssue[]
}

export interface ImportantTextRegion {
  regionId: ID
  text?: string
  frameTimeSeconds?: Seconds
  boundingBox: JSONObject
  confidence: number
  reason?: string
}

export interface OCRAnalysisSummary {
  ocrNeeded: boolean
  sampledFrameCount: number
  textRegionsArtifactId?: ID
  importantTextRegions: ImportantTextRegion[]
  confidence: number
}

export interface MediaAnalysisReport {
  id: ID
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  sourceStorageObjectId: ID
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata: MediaAnalysisMetadata
  videoStreams: MediaVideoStream[]
  audioStreams: MediaAudioStream[]
  proxy: MediaProxyInfo
  keyframes: MediaKeyframeInfo[]
  sceneAnalysis: SceneAnalysisSummary
  speechAnalysis: SpeechAnalysisSummary
  audioAnalysis: AudioAnalysisSummary
  visualAnalysis: VisualAnalysisSummary
  colorAnalysis: ColorAnalysisSummary
  ocrAnalysis: OCRAnalysisSummary
  qualityIssues: ProductionToolIssue[]
  recommendedRecipeIds: ID[]
  status: MediaAnalysisReportStatus
}
