import type { AudioAnalysisSummary as MediaAudioAnalysisSummary, MediaAnalysisReport, SilenceSegment } from '../../../src/backend/contracts/media-analysis-report'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { CaptionSegment } from '../captions'
import type { TranscriptSegment } from '../speech'
import type { SmartCutPlan } from '../smart-cut'
import type { TimelineBuildResult } from '../timeline'

export type AudioFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export type AudioFoundationTask =
  | 'analyze_audio'
  | 'detect_loudness'
  | 'detect_clipping'
  | 'detect_silence'
  | 'detect_music_overlap'
  | 'plan_voice_cleanup'
  | 'plan_noise_reduction'
  | 'plan_loudness_normalization'
  | 'plan_music_ducking'
  | 'plan_sfx_density'
  | 'plan_soundsync_cues'
  | 'build_audio_qa'
  | 'prepare_cleaned_audio_artifact'
  | 'prepare_separated_stem_artifact'

export type AudioToolId =
  | 'ffmpeg'
  | 'deepfilternet'
  | 'rnnoise'
  | 'demucs'
  | 'soundtouch'
  | 'signalsmith_stretch'
  | 'none'

export type VoiceCondition =
  | 'clean_voice'
  | 'mild_noise'
  | 'heavy_noise'
  | 'echo_or_room'
  | 'clipping'
  | 'music_under_voice'
  | 'unknown'

export type CleanupStrength = 'none' | 'light' | 'medium' | 'strong'

export interface AudioToolSkipReason {
  code: string
  message: string
  tool?: Exclude<AudioToolId, 'none'>
}

export interface AudioAnalysisSummary {
  durationSeconds: number
  peakDb?: number
  integratedLufs?: number
  truePeakDb?: number
  clippingDetected: boolean
  silenceSegments: SilenceSegment[]
  noiseLevel?: number
  speechPresence: 'present' | 'absent' | 'unknown'
  musicDetected: boolean
  musicSpeechOverlap: boolean
  energyCurveArtifactId?: string
  advancedAnalysisRan: boolean
  issues: ProductionToolIssue[]
}

export interface VoiceCleanupOperation {
  operationId: string
  toolId: AudioToolId
  operationType: 'noise_reduction' | 'loudness_only' | 'declip_warning' | 'room_tone_warning' | 'none'
  strength: CleanupStrength
  reason: string
  risks: string[]
}

export interface AudioCleanupPlan {
  id: string
  cleanupStrength: CleanupStrength
  selectedPrimaryTool: Extract<AudioToolId, 'ffmpeg' | 'deepfilternet' | 'rnnoise' | 'none'>
  fallbackTools: AudioToolId[]
  operations: VoiceCleanupOperation[]
  reasons: string[]
  risks: string[]
  expectedArtifacts: Array<'cleaned_audio' | 'audio_analysis_json' | 'qa_report'>
  requiredQAGates: Array<'audio_loudness' | 'audio_sync' | 'audio_naturalness' | 'music_over_voice'>
}

export interface LoudnessNormalizationPlan {
  targetLufs: number
  truePeakDb: number
  shouldNormalize: boolean
  reason: string
  warnings: string[]
}

export interface MusicSpeechOverlapFinding {
  overlapDetected: boolean
  confidence: number
  ranges: Array<{ startSeconds: number; endSeconds: number }>
  recommendation: 'duck_music' | 'consider_demucs' | 'leave_music' | 'needs_more_analysis'
  warnings: string[]
}

export interface MusicDuckingPlan {
  enabled: boolean
  duckingDb: number
  attackMs: number
  releaseMs: number
  reason: string
  voiceFirst: true
  warnings: string[]
}

export interface SfxDensityPlan {
  maxSfxPerMinute: number
  randomSfxAllowed: false
  allowedCueTypes: string[]
  warnings: string[]
}

export type SoundSyncCueType =
  | 'cut'
  | 'caption_emphasis'
  | 'visual_reveal'
  | 'transition'
  | 'sfx_hit'
  | 'music_duck'
  | 'beat_marker'
  | 'emotional_pause'
  | 'card_reveal'
  | 'custom'

export interface SoundSyncCue {
  cueId: string
  cueType: SoundSyncCueType
  timeSeconds: number
  durationSeconds?: number
  reason: string
  confidence: number
  source: 'timeline' | 'caption' | 'smart_cut' | 'energy_placeholder' | 'visual_cue' | 'manual_metadata'
}

export interface SoundSyncCuePlan {
  cues: SoundSyncCue[]
  beatDetectionRan: false
  warnings: string[]
}

export interface AudioArtifactSummary {
  artifactId: string
  artifactType: Extract<ToolArtifact['artifactType'], 'audio_analysis_json' | 'cleaned_audio' | 'separated_audio_stem' | 'qa_report'>
  storageObjectPath: string
  contentType: string
  sourceOfTruth: true
  isPrivate: true
}

export interface AudioQAResult {
  qualityGateResults: QualityGateResult[]
  issues: string[]
}

export interface AudioFoundationRunnerInput {
  mode: AudioFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  sourceAudioArtifactId?: string
  sourceAudioStorageObjectPath?: string
  sourceAudioLocalPath?: string
  outputRoot?: string
  ffmpegBin?: string
  timeoutMs?: number
  localDevToolExecution?: boolean
  localDevFfmpegLoudness?: boolean
  mediaAnalysisReport?: MediaAnalysisReport
  mediaAudioAnalysis?: MediaAudioAnalysisSummary
  transcriptSegments?: TranscriptSegment[]
  captionSegments?: CaptionSegment[]
  smartCutPlan?: SmartCutPlan
  timelineResult?: TimelineBuildResult
  approvedDirectiveSummary?: string
  userIntentSummary?: string
  platform?: 'social' | 'web' | 'broadcast' | 'podcast' | 'education' | 'premium' | 'custom'
  voiceOnly?: boolean
  requestedSfxDensity?: 'none' | 'light' | 'medium' | 'heavy'
  tasks?: AudioFoundationTask[]
  mockAnalysis?: Partial<AudioAnalysisSummary>
}

export interface AudioFoundationResult {
  mode: AudioFoundationRunMode
  status: 'dry_run' | 'partial' | 'blocked' | 'failed'
  expectedActions: AudioFoundationTask[]
  audioAnalysis?: AudioAnalysisSummary
  cleanupPlan?: AudioCleanupPlan
  loudnessPlan?: LoudnessNormalizationPlan
  overlapFinding?: MusicSpeechOverlapFinding
  duckingPlan?: MusicDuckingPlan
  sfxDensityPlan?: SfxDensityPlan
  soundSyncCuePlan?: SoundSyncCuePlan
  artifactRecords: ToolArtifact[]
  qualityGateResults: QualityGateResult[]
  skipReasons: AudioToolSkipReason[]
  warnings: string[]
}
