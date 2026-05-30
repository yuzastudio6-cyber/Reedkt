import { buildAudioAnalysisSummary } from './audio-analysis-adapter'
import { buildAudioCleanupPlan } from './audio-cleanup-plan-builder'
import { buildLoudnessNormalizationPlan } from './loudness-normalization-policy'
import { buildMusicDuckingPlan } from './music-ducking-plan-builder'
import { evaluateMusicSpeechOverlap } from './music-speech-overlap-policy'
import { buildSoundSyncCuePlan } from './soundsync-cue-planner'
import type { AudioFoundationRunnerInput } from './audio-foundation-types'
import type { AudioExecutionInput, AudioExecutionOperation, AudioExecutionPlan } from './audio-execution-types'

export function buildAudioExecutionPlan(input: AudioExecutionInput): AudioExecutionPlan {
  const audioAnalysis = input.audioAnalysis ?? buildAudioAnalysisSummary(toFoundationInput(input))
  const cleanupPlan = input.audioCleanupPlan ?? buildAudioCleanupPlan({
    workspaceId: input.workspaceId,
    mediaAssetId: input.mediaAssetId,
    audioAnalysis,
  })
  const loudnessPlan = input.loudnessPlan ?? buildLoudnessNormalizationPlan({ analysis: audioAnalysis, platform: input.platform })
  const overlap = evaluateMusicSpeechOverlap({ analysis: audioAnalysis })
  const duckingPlan = input.musicDuckingPlan ?? buildMusicDuckingPlan({ finding: overlap, voiceOnly: input.voiceOnly })
  const soundSyncCuePlan = input.soundSyncCuePlan ?? buildSoundSyncCuePlan({ audioAnalysis })
  const selectedOperations = buildOperations({
    cleanupPlan,
    loudnessShouldNormalize: loudnessPlan.shouldNormalize,
    duckingEnabled: duckingPlan.enabled,
    soundSyncCueCount: soundSyncCuePlan.cues.length,
    demucsJustified: overlap.overlapDetected || Boolean(input.approvedDemucsReason),
  })

  return {
    executionPlanId: `audio-execution-${input.mediaAssetId}`,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    selectedOperations,
    loudnessOperationPlan: {
      analyze: true,
      normalize: loudnessPlan.shouldNormalize,
      targetLufs: loudnessPlan.targetLufs,
      truePeakDb: loudnessPlan.truePeakDb,
    },
    cleanupOperationPlan: {
      selectedPrimaryTool: cleanupPlan.selectedPrimaryTool,
      strength: cleanupPlan.cleanupStrength,
      operations: cleanupPlan.operations,
      modelToolsAllowed: input.enableModelAudioExecution === true,
    },
    musicDuckingOperationPlan: {
      enabled: duckingPlan.enabled,
      voiceFirst: true,
      duckingDb: duckingPlan.duckingDb,
      attackMs: duckingPlan.attackMs,
      releaseMs: duckingPlan.releaseMs,
      finalMuxAllowed: false,
    },
    soundSyncArtifactPlan: {
      cueCount: soundSyncCuePlan.cues.length,
      beatDetectionClaimed: false,
      artifactType: 'audio_analysis_json',
    },
    expectedArtifacts: [
      'audio_analysis_json',
      'qa_report',
      ...(cleanupPlan.selectedPrimaryTool !== 'none' ? ['cleaned_audio' as const] : []),
      ...(selectedOperations.includes('separate_music_speech_demucs') ? ['separated_audio_stem' as const] : []),
    ],
    requiredQualityGates: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
    reasons: [
      ...cleanupPlan.reasons,
      loudnessPlan.reason,
      duckingPlan.reason,
      `${soundSyncCuePlan.cues.length} SoundSync cue metadata items planned.`,
    ],
    warnings: [
      ...cleanupPlan.risks,
      ...loudnessPlan.warnings,
      ...duckingPlan.warnings,
      ...soundSyncCuePlan.warnings,
    ],
    finalMuxAllowed: false,
  }
}

function buildOperations(input: {
  cleanupPlan: ReturnType<typeof buildAudioCleanupPlan>
  loudnessShouldNormalize: boolean
  duckingEnabled: boolean
  soundSyncCueCount: number
  demucsJustified: boolean
}): AudioExecutionOperation[] {
  const operations: AudioExecutionOperation[] = ['analyze_loudness']
  if (input.loudnessShouldNormalize) operations.push('normalize_loudness')
  if (input.cleanupPlan.selectedPrimaryTool === 'ffmpeg') operations.push('clean_voice_ffmpeg_basic')
  if (input.cleanupPlan.selectedPrimaryTool === 'deepfilternet') operations.push('clean_voice_deepfilternet')
  if (input.demucsJustified && input.cleanupPlan.fallbackTools.includes('demucs')) operations.push('separate_music_speech_demucs')
  if (input.duckingEnabled) operations.push('duck_music_under_voice')
  if (input.soundSyncCueCount > 0) operations.push('generate_soundsync_cues')
  operations.push('qa_audio')
  return operations
}

function toFoundationInput(input: AudioExecutionInput): AudioFoundationRunnerInput {
  return {
    mode: input.mode === 'local_dev' ? 'local_dev' : input.mode === 'production_blocked' ? 'production_blocked' : 'dry_run',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    idempotencyKey: input.idempotencyKey,
    sourceAudioArtifactId: input.sourceAudioArtifactId,
    sourceAudioStorageObjectPath: input.sourceAudioStorageObjectPath,
    sourceAudioLocalPath: input.sourceAudioLocalPath,
  }
}
