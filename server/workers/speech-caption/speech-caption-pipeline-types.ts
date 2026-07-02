import type { MediaAnalysisReport } from '../../../src/backend/contracts/media-analysis-report'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { CaptionFileBuildResult, CaptionFileFormat, CaptionFoundationSkipReason, CaptionStylePresetId, CaptionSegment } from '../captions'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type {
  SpeechFoundationSkipReason,
  TranscriptArtifactPayload,
  TranscriptSegment,
  TranscriptWord,
  WordTimestampArtifactPayload,
} from '../speech'

export type SpeechCaptionExecutionSkipReason = SpeechFoundationSkipReason | CaptionFoundationSkipReason

export type SpeechCaptionExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type SpeechCaptionExecutionStatus =
  | 'dry_run'
  | 'completed'
  | 'partial'
  | 'skipped'
  | 'blocked'
  | 'failed'

export interface SpeechExecutionInput {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  sourceAudioArtifactId: string
  sourceAudioLocalPath?: string
  outputDirectory?: string
  modelWeightManifestId?: string
  modelName?: string
  localModelPath?: string
  language?: string
  device: 'cpu' | 'cuda' | 'auto'
  computeType?: string
  wordTimestamps: boolean
  vadFilter: boolean
  beamSize?: number
  timeoutMs: number
  mode: SpeechCaptionExecutionMode
  enableRealTranscription?: boolean
  allowModelDownload?: boolean
  fasterWhisperCommand?: string
  pythonCommand?: string
  workerPayload?: ProductionWorkerJobPayload
  mockSegments?: TranscriptSegment[]
  arbitraryArgs?: string[]
}

export interface SpeechExecutionResult {
  mode: SpeechCaptionExecutionMode
  status: SpeechCaptionExecutionStatus
  transcript?: TranscriptArtifactPayload
  wordTimestamps?: WordTimestampArtifactPayload
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  modelWeightStatus: 'not_required' | 'approved' | 'needs_review' | 'blocked' | 'missing' | 'dry_run'
  skippedReasons: SpeechCaptionExecutionSkipReason[]
  warnings: string[]
}

export interface CaptionExecutionInput {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  transcriptArtifactId?: string
  transcript?: TranscriptArtifactPayload
  transcriptSegments?: TranscriptSegment[]
  wordTimestampArtifactId?: string
  wordTimestamps?: WordTimestampArtifactPayload | TranscriptWord[]
  captionStyle?: CaptionStylePresetId
  platform?: string
  aspectRatio?: string
  safeZoneArtifactIds?: string[]
  ocrTextRegionArtifactIds?: string[]
  outputDirectory?: string
  buildSrt?: boolean
  buildWebVtt?: boolean
  buildAss?: boolean
  buildPreview?: boolean
  sourceVideoLocalPath?: string
  ffmpegBin?: string
  timeoutMs?: number
  mode: SpeechCaptionExecutionMode
  enableCaptionPreview?: boolean
  workerPayload?: ProductionWorkerJobPayload
}

export interface CaptionExecutionResult {
  mode: SpeechCaptionExecutionMode
  status: SpeechCaptionExecutionStatus
  captionSegments: CaptionSegment[]
  captionFiles: CaptionFileBuildResult[]
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: SpeechCaptionExecutionSkipReason[]
  warnings: string[]
}

export interface SpeechCaptionExecutionPipelineInput {
  mode: SpeechCaptionExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  sourceAudioArtifactId: string
  sourceAudioLocalPath?: string
  sourceVideoLocalPath?: string
  outputDirectory?: string
  modelWeightManifestId?: string
  modelName?: string
  localModelPath?: string
  language?: string
  device?: 'cpu' | 'cuda' | 'auto'
  computeType?: string
  wordTimestamps?: boolean
  vadFilter?: boolean
  beamSize?: number
  timeoutMs?: number
  enableRealTranscription?: boolean
  allowModelDownload?: boolean
  enableCaptionPreview?: boolean
  buildSpeech?: boolean
  buildCaptions?: boolean
  captionFormats?: CaptionFileFormat[]
  captionStyle?: CaptionStylePresetId
  existingMediaAnalysisReport?: MediaAnalysisReport
  workerPayload?: ProductionWorkerJobPayload
  mockSegments?: TranscriptSegment[]
}

export interface SpeechCaptionExecutionPipelineResult {
  mode: SpeechCaptionExecutionMode
  status: SpeechCaptionExecutionStatus
  transcriptArtifacts: ToolArtifact[]
  captionArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  modelWeightStatus: SpeechExecutionResult['modelWeightStatus']
  skippedReasons: SpeechCaptionExecutionSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
  transcript?: TranscriptArtifactPayload
  wordTimestamps?: WordTimestampArtifactPayload
  captionSegments: CaptionSegment[]
  captionFiles: CaptionFileBuildResult[]
  updatedMediaAnalysisReport?: MediaAnalysisReport
}
