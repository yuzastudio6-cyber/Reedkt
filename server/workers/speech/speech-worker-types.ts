import type { MediaAnalysisReport, RepeatedTakeCandidate, SpeechFillerSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type SpeechFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export type SpeechFoundationTask =
  | 'transcribe'
  | 'build_transcript_artifact'
  | 'build_word_timestamp_artifact'
  | 'detect_fillers'
  | 'detect_repeated_takes'
  | 'build_speech_analysis_report'

export interface SpeechFoundationSkipReason {
  code: string
  message: string
  tool?: 'faster_whisper'
}

export interface TranscriptWord {
  word: string
  startSeconds: number
  endSeconds: number
  confidence?: number
  segmentId: string
}

export interface TranscriptSegment {
  segmentId: string
  startSeconds: number
  endSeconds: number
  text: string
  words: TranscriptWord[]
  confidence?: number
}

export interface TranscriptArtifactPayload {
  language?: string
  languageConfidence?: number
  segments: TranscriptSegment[]
  fullText: string
  durationSeconds: number
  sourceAudioArtifactId: string
  modelInfo: SpeechModelInfo
  confidence: number
  issues: SpeechFoundationIssue[]
}

export interface WordTimestampArtifactPayload {
  words: TranscriptWord[]
  sourceAudioArtifactId: string
  modelInfo: SpeechModelInfo
}

export interface SpeechModelInfo {
  toolId: 'faster_whisper' | 'mock_transcript'
  modelName?: string
  modelVersion?: string
  modelWeightManifestId?: string
  localModelReference?: string
}

export interface SpeechFoundationIssue {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'blocking'
}

export interface FasterWhisperInput {
  localAudioPath?: string
  outputJsonPath?: string
  modelName?: string
  localModelPath?: string
  device: 'cpu' | 'cuda' | 'auto'
  computeType?: string
  language?: string
  wordTimestamps: boolean
  vadFilter: boolean
  beamSize?: number
  timeoutMs: number
  fasterWhisperCommand?: string
  pythonCommand?: string
  allowModelDownload?: boolean
  modelWeightManifestId?: string
  runMode: SpeechFoundationRunMode
}

export interface FasterWhisperCommandPlan {
  command: string
  args: string[]
  outputJsonPath?: string
  summary: string
}

export interface FasterWhisperTranscriptionResult {
  status: 'completed' | 'skipped'
  segments: TranscriptSegment[]
  language?: string
  confidence: number
  modelInfo: SpeechModelInfo
  skipReason?: SpeechFoundationSkipReason
}

export interface SpeechAnalysisUpdate {
  speechDetected: boolean
  transcriptArtifactId?: string
  wordTimestampArtifactId?: string
  language?: string
  confidence: number
  fillerSegments: SpeechFillerSegment[]
  repeatedTakeCandidates: RepeatedTakeCandidate[]
  issues: SpeechFoundationIssue[]
}

export interface SpeechFoundationRunnerInput {
  mode: SpeechFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceAudioArtifactId: string
  audioStorageObjectPath?: string
  localAudioPath?: string
  outputRoot?: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  timeoutMs?: number
  fasterWhisper?: Partial<FasterWhisperInput>
  mockSegments?: TranscriptSegment[]
  existingMediaAnalysisReport?: MediaAnalysisReport
  tasks?: SpeechFoundationTask[]
}

export interface SpeechFoundationResult {
  mode: SpeechFoundationRunMode
  status: 'dry_run' | 'completed' | 'partial' | 'skipped' | 'blocked' | 'failed'
  expectedActions: SpeechFoundationTask[]
  transcript?: TranscriptArtifactPayload
  wordTimestamps?: WordTimestampArtifactPayload
  artifacts: ToolArtifact[]
  speechAnalysis?: SpeechAnalysisUpdate
  updatedMediaAnalysisReport?: MediaAnalysisReport
  skipReasons: SpeechFoundationSkipReason[]
  warnings: string[]
}
