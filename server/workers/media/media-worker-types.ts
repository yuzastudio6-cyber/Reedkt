import type { MediaAnalysisReport } from '../../../src/backend/contracts/media-analysis-report'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type MediaFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export type MediaFoundationTask =
  | 'probe'
  | 'create_proxy'
  | 'extract_audio'
  | 'extract_keyframes'
  | 'extract_representative_frames'
  | 'build_analysis_report'

export interface MediaFoundationSkipReason {
  code: string
  message: string
  tool?: 'ffmpeg' | 'ffprobe'
}

export interface MediaFoundationStorageReference {
  sourceStorageObjectId?: string
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  localFilePath?: string
  contentType?: string
  sizeBytes?: number
  isPrivate: true
  sourceOfTruth: true
}

export interface ResolvedLocalMediaPath {
  storageReference: MediaFoundationStorageReference
  localFilePath?: string
  storageMode: 'local' | 'gcs_metadata_only'
  pathSummary: string
}

export interface MediaVideoStreamProbe {
  streamIndex: number
  codecName: string
  width: number
  height: number
  fps?: number
  durationSeconds?: number
  pixelFormat?: string
  colorSpace?: string
  rotation?: number
}

export interface MediaAudioStreamProbe {
  streamIndex: number
  codecName: string
  sampleRate?: number
  channels?: number
  durationSeconds?: number
}

export interface MediaProbeResult {
  durationSeconds: number
  width: number
  height: number
  fps: number
  codecName: string
  formatName: string
  rotation: number
  aspectRatio: string
  sizeBytes: number
  videoStreams: MediaVideoStreamProbe[]
  audioStreams: MediaAudioStreamProbe[]
  streamCount: number
  rawProbeSummary: Record<string, unknown>
}

export interface MediaFoundationArtifactSummary {
  artifactId: string
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  localFilePath?: string
  contentType: string
  sizeBytes?: number
  checksum?: string
  timeSeconds?: number
  frameNumber?: number
  width?: number
  height?: number
  sourceOfTruth: true
  isPrivate: true
}

export interface MediaProxyResult {
  status: 'created' | 'skipped'
  artifact?: MediaFoundationArtifactSummary
  width?: number
  height?: number
  durationSeconds?: number
  skipReason?: MediaFoundationSkipReason
}

export interface ExtractedAudioResult {
  status: 'created' | 'skipped'
  artifact?: MediaFoundationArtifactSummary
  sampleRate?: number
  channels?: number
  skipReason?: MediaFoundationSkipReason
}

export interface ExtractedFrameResult {
  status: 'created' | 'skipped'
  artifacts: MediaFoundationArtifactSummary[]
  skipReason?: MediaFoundationSkipReason
}

export interface MediaFoundationResult {
  mode: MediaFoundationRunMode
  status: 'dry_run' | 'completed' | 'partial' | 'skipped' | 'blocked' | 'failed'
  expectedActions: MediaFoundationTask[]
  probe?: MediaProbeResult
  proxy?: MediaProxyResult
  audio?: ExtractedAudioResult
  keyframes?: ExtractedFrameResult
  representativeFrames?: ExtractedFrameResult
  artifactRecords: ToolArtifact[]
  mediaAnalysisReport?: MediaAnalysisReport
  skipReasons: MediaFoundationSkipReason[]
  warnings: string[]
}

export interface MediaFoundationRunnerInput {
  mode: MediaFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceStorageObjectId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  source: MediaFoundationStorageReference
  localStorageRoot?: string
  outputRoot?: string
  ffprobeBin?: string
  ffmpegBin?: string
  timeoutMs?: number
  tasks?: MediaFoundationTask[]
  maxRepresentativeFrameCount?: number
  maxKeyframeCount?: number
}

export interface FFprobeMediaInput {
  localFilePath: string
  ffprobeBin: string
  timeoutMs: number
}

export interface FFmpegCommandInput {
  ffmpegBin: string
  args: string[]
  timeoutMs: number
  expectedOutputPaths: string[]
  purpose: MediaFoundationTask
}

export interface FFmpegMediaInputBase {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  safeOutputRoot: string
}

export interface CreateProxyVideoInput extends FFmpegMediaInputBase {
  outputLocalPath: string
  targetMaxWidth?: number
  keepAudio?: boolean
}

export interface ExtractAudioTrackInput extends FFmpegMediaInputBase {
  outputLocalPath: string
  sampleRate?: number
  channels?: number
}

export interface ExtractKeyframesInput extends FFmpegMediaInputBase {
  outputDirectory: string
  frameIntervalSeconds?: number
  maxFrameCount?: number
}

export interface ExtractRepresentativeFramesInput extends FFmpegMediaInputBase {
  outputDirectory: string
  durationSeconds?: number
  maxFrameCount?: number
}
