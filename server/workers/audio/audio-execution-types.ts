import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { AudioCleanupPlan, AudioAnalysisSummary, LoudnessNormalizationPlan, MusicDuckingPlan, SoundSyncCuePlan, AudioToolSkipReason } from './audio-foundation-types'
import type { FFmpegAudioCommandPlan } from './ffmpeg-audio-adapter'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type AudioExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type AudioExecutionOperation =
  | 'analyze_loudness'
  | 'normalize_loudness'
  | 'clean_voice_ffmpeg_basic'
  | 'clean_voice_deepfilternet'
  | 'clean_voice_rnnoise'
  | 'separate_music_speech_demucs'
  | 'duck_music_under_voice'
  | 'generate_soundsync_cues'
  | 'qa_audio'

export interface AudioExecutionInput {
  mode: AudioExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  sourceAudioArtifactId: string
  sourceAudioStorageObjectPath?: string
  sourceAudioLocalPath?: string
  outputDirectory?: string
  audioAnalysis?: AudioAnalysisSummary
  audioCleanupPlan?: AudioCleanupPlan
  loudnessPlan?: LoudnessNormalizationPlan
  musicDuckingPlan?: MusicDuckingPlan
  soundSyncCuePlan?: SoundSyncCuePlan
  transcriptArtifactIds?: string[]
  timelineManifestId?: string
  smartCutPlanId?: string
  modelWeightManifestIds?: string[]
  enableFfmpegAudioExecution?: boolean
  enableModelAudioExecution?: boolean
  allowModelDownload?: boolean
  allowFinalMux?: boolean
  ffmpegBin?: string
  timeoutMs?: number
  platform?: 'social' | 'web' | 'broadcast' | 'podcast' | 'education' | 'premium' | 'custom'
  voiceOnly?: boolean
  approvedDemucsReason?: string
  localDevToolExecution?: boolean
  readinessReport?: { overallStatus?: string; blockers?: unknown[]; blockerSummaries?: unknown[] }
  rawPrompt?: unknown
  promptText?: unknown
  rawUserChat?: unknown
  signedUrl?: unknown
  serviceRoleKey?: unknown
  providerApiKey?: unknown
  secretValue?: unknown
  arbitraryFfmpegArgs?: string[]
}

export interface AudioExecutionPlan {
  executionPlanId: string
  sourceAudioArtifactId: string
  selectedOperations: AudioExecutionOperation[]
  loudnessOperationPlan: {
    analyze: boolean
    normalize: boolean
    targetLufs: number
    truePeakDb: number
    commandPlan?: FFmpegAudioCommandPlan
  }
  cleanupOperationPlan: {
    selectedPrimaryTool: AudioCleanupPlan['selectedPrimaryTool']
    strength: AudioCleanupPlan['cleanupStrength']
    operations: AudioCleanupPlan['operations']
    modelToolsAllowed: boolean
  }
  musicDuckingOperationPlan: {
    enabled: boolean
    voiceFirst: true
    duckingDb: number
    attackMs: number
    releaseMs: number
    finalMuxAllowed: false
  }
  soundSyncArtifactPlan: {
    cueCount: number
    beatDetectionClaimed: false
    artifactType: Extract<ToolArtifact['artifactType'], 'audio_analysis_json'>
  }
  expectedArtifacts: Array<Extract<ToolArtifact['artifactType'], 'cleaned_audio' | 'separated_audio_stem' | 'audio_analysis_json' | 'qa_report'>>
  requiredQualityGates: Array<Extract<QualityGateResult['gateType'], 'audio_loudness' | 'audio_sync' | 'audio_naturalness' | 'music_over_voice'>>
  reasons: string[]
  warnings: string[]
  finalMuxAllowed: false
}

export interface AudioExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface AudioExecutionValidationResult {
  valid: boolean
  issues: AudioExecutionValidationIssue[]
}

export interface AudioLoudnessExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  commandPlan: FFmpegAudioCommandPlan
  integratedLufs?: number
  truePeakDb?: number
  skipReason?: AudioToolSkipReason
  errorMessage?: string
}

export interface AudioNormalizationExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  commandPlan: FFmpegAudioCommandPlan
  cleanedAudioArtifact?: ToolArtifact
  outputAudioLocalPath?: string
  skipReason?: AudioToolSkipReason
  errorMessage?: string
}

export interface AudioCleanupExecutionResult {
  status: 'planned' | 'partial' | 'skipped'
  cleanedAudioArtifact?: ToolArtifact
  separatedStemArtifacts: ToolArtifact[]
  skipReasons: AudioToolSkipReason[]
  warnings: string[]
}

export interface AudioExecutionResult {
  mode: AudioExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  executionPlan?: AudioExecutionPlan
  loudnessResult?: AudioLoudnessExecutionResult
  normalizationResult?: AudioNormalizationExecutionResult
  cleanedAudioArtifact?: ToolArtifact
  separatedStemArtifacts: ToolArtifact[]
  soundSyncArtifact?: ToolArtifact
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: AudioToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}
