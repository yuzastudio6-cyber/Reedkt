import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { buildAudioAnalysisSummary } from './audio-analysis-adapter'
import { buildAudioCleanupPlan } from './audio-cleanup-plan-builder'
import { buildAudioFoundationArtifacts } from './audio-artifact-builder'
import { buildAudioQAResults } from './audio-qa-builder'
import { buildDeepFilterNetSkipReason } from './deepfilternet-adapter'
import { buildDemucsSkipReason } from './demucs-adapter'
import { buildFFmpegAudioLoudnessCommand, buildFFmpegAudioSkipReason, parseLoudnessOutput, runFFmpegAudioCommand } from './ffmpeg-audio-adapter'
import { buildLoudnessNormalizationPlan } from './loudness-normalization-policy'
import { buildMusicDuckingPlan } from './music-ducking-plan-builder'
import { evaluateMusicSpeechOverlap } from './music-speech-overlap-policy'
import { buildRNNoiseSkipReason } from './rnnoise-adapter'
import { buildSfxDensityPlan } from './sfx-density-policy'
import { buildSkipReason as buildSoundTouchSkipReason } from './soundtouch-adapter'
import { buildSignalsmithStretchSkipReason } from './signalsmith-stretch-adapter'
import { buildSoundSyncCuePlan } from './soundsync-cue-planner'
import type { AudioFoundationResult, AudioFoundationRunnerInput, AudioFoundationTask, AudioToolSkipReason } from './audio-foundation-types'

const defaultTasks: AudioFoundationTask[] = [
  'analyze_audio',
  'detect_loudness',
  'detect_clipping',
  'detect_silence',
  'detect_music_overlap',
  'plan_voice_cleanup',
  'plan_noise_reduction',
  'plan_loudness_normalization',
  'plan_music_ducking',
  'plan_sfx_density',
  'plan_soundsync_cues',
  'build_audio_qa',
  'prepare_cleaned_audio_artifact',
  'prepare_separated_stem_artifact',
]

export async function runAudioFoundation(input: AudioFoundationRunnerInput): Promise<AudioFoundationResult> {
  validateAudioFoundationInput(input)

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      expectedActions: input.tasks ?? defaultTasks,
      artifactRecords: [],
      qualityGateResults: [],
      skipReasons: [{ code: 'production_audio_processing_blocked', message: 'Milestone 9 blocks production cleanup, separation, SoundSync processing, and final mux/export.' }],
      warnings: ['Production audio execution remains blocked until future deployment/model approval milestones.'],
    }
  }

  const skipReasons: AudioToolSkipReason[] = []
  const audioAnalysis = buildAudioAnalysisSummary(input)
  if (input.mode === 'local_dev' && input.localDevFfmpegLoudness) {
    const ffmpegInput = {
      sourceAudioLocalPath: input.sourceAudioLocalPath,
      ffmpegBin: input.ffmpegBin ?? 'ffmpeg',
      timeoutMs: input.timeoutMs ?? 15_000,
      operation: 'loudness_probe' as const,
      runMode: input.mode,
    }
    const skip = buildFFmpegAudioSkipReason(ffmpegInput)
    if (skip) skipReasons.push(skip)
    else {
      try {
        const output = await runFFmpegAudioCommand({ ...buildFFmpegAudioLoudnessCommand(ffmpegInput), timeoutMs: ffmpegInput.timeoutMs })
        const loudness = parseLoudnessOutput(output)
        if (typeof loudness.integratedLufs === 'number') audioAnalysis.integratedLufs = loudness.integratedLufs
        if (typeof loudness.truePeakDb === 'number') audioAnalysis.truePeakDb = loudness.truePeakDb
      } catch (error) {
        skipReasons.push({
          code: 'ffmpeg_audio_unavailable',
          message: error instanceof Error
            ? `local_dev FFmpeg loudness skipped: ${error.message}`
            : 'local_dev FFmpeg loudness skipped because FFmpeg is unavailable.',
          tool: 'ffmpeg',
        })
      }
    }
  }

  skipReasons.push(
    ...[
      buildDeepFilterNetSkipReason({ runMode: input.mode, timeoutMs: input.timeoutMs ?? 10_000, localDevToolExecution: input.localDevToolExecution, sourceAudioLocalPath: input.sourceAudioLocalPath }),
      buildRNNoiseSkipReason({ runMode: input.mode, timeoutMs: input.timeoutMs ?? 10_000, localDevToolExecution: input.localDevToolExecution, sourceAudioLocalPath: input.sourceAudioLocalPath }),
      buildDemucsSkipReason({ runMode: input.mode, timeoutMs: input.timeoutMs ?? 10_000, localDevToolExecution: input.localDevToolExecution, sourceAudioLocalPath: input.sourceAudioLocalPath }),
      buildSoundTouchSkipReason({ runMode: input.mode, timeoutMs: input.timeoutMs ?? 10_000, localDevToolExecution: input.localDevToolExecution, sourceAudioLocalPath: input.sourceAudioLocalPath }),
      buildSignalsmithStretchSkipReason({ runMode: input.mode, timeoutMs: input.timeoutMs ?? 10_000, localDevToolExecution: input.localDevToolExecution, sourceAudioLocalPath: input.sourceAudioLocalPath }),
    ].filter((reason): reason is AudioToolSkipReason => Boolean(reason)),
  )

  const cleanupPlan = buildAudioCleanupPlan({
    workspaceId: input.workspaceId,
    mediaAssetId: input.mediaAssetId,
    audioAnalysis,
    approvedDirectiveSummary: input.approvedDirectiveSummary,
    userIntentSummary: input.userIntentSummary,
  })
  const loudnessPlan = buildLoudnessNormalizationPlan({ analysis: audioAnalysis, platform: input.platform })
  const overlapFinding = evaluateMusicSpeechOverlap({ analysis: audioAnalysis })
  const duckingPlan = buildMusicDuckingPlan({ finding: overlapFinding, voiceOnly: input.voiceOnly })
  const sfxDensityPlan = buildSfxDensityPlan({ requestedDensity: input.requestedSfxDensity })
  const soundSyncCuePlan = buildSoundSyncCuePlan({
    audioAnalysis,
    captionSegments: input.captionSegments,
    smartCutPlan: input.smartCutPlan,
    timelineResult: input.timelineResult,
  })
  const qa = buildAudioQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    audioAnalysis,
    cleanupPlan,
    loudnessPlan,
    duckingPlan,
  })
  const artifactRecords = buildAudioFoundationArtifacts({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    includeCleanedAudio: cleanupPlan.selectedPrimaryTool !== 'none',
    includeSeparatedStem: overlapFinding.recommendation === 'consider_demucs',
  })

  return {
    mode: input.mode,
    status: input.mode === 'dry_run' ? 'dry_run' : 'partial',
    expectedActions: input.tasks ?? defaultTasks,
    audioAnalysis,
    cleanupPlan,
    loudnessPlan,
    overlapFinding,
    duckingPlan,
    sfxDensityPlan,
    soundSyncCuePlan,
    artifactRecords,
    qualityGateResults: qa.qualityGateResults,
    skipReasons,
    warnings: [
      ...audioAnalysis.issues.map((issue) => issue.message),
      ...loudnessPlan.warnings,
      ...duckingPlan.warnings,
      ...sfxDensityPlan.warnings,
      ...soundSyncCuePlan.warnings,
      ...qa.issues,
      'Milestone 9 does not final mux/export audio or video.',
    ],
  }
}

function validateAudioFoundationInput(input: AudioFoundationRunnerInput): void {
  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }
}
