import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  assertAudioStorageReferenceIsPrivate,
  buildAudioAnalysisSummary,
  buildAudioCleanupPlan,
  buildAudioFoundationArtifacts,
  buildAudioQAResults,
  buildDeepFilterNetSkipReason,
  buildDemucsSkipReason,
  buildFFmpegAudioLoudnessCommand,
  buildFFmpegAudioNormalizeCommand,
  buildLoudnessNormalizationPlan,
  buildMusicDuckingPlan,
  buildRNNoiseSkipReason,
  buildSfxDensityPlan,
  buildSignalsmithStretchSkipReason,
  buildSkipReason as buildSoundTouchSkipReason,
  buildSoundSyncCuePlan,
  chooseVoiceCleanupStrength,
  evaluateMusicSpeechOverlap,
  runAudioFoundation,
  validateFFmpegAudioInput,
} from '../workers/audio'
import type { AudioAnalysisSummary } from '../workers/audio'

const execFileAsync = promisify(execFile)

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function expectRejects(fn: () => unknown | Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await fn()
  } catch {
    rejected = true
  }
  check(rejected, message)
}

await expectRejects(
  () => assertAudioStorageReferenceIsPrivate({ storageObjectPath: 'https://storage.example/audio.wav?X-Goog-Signature=abc' }),
  'Audio storage policy must reject signed URLs.',
)

await expectRejects(
  () => assertAudioStorageReferenceIsPrivate({ localPath: '..\\audio.wav' }),
  'Audio path safety must reject traversal.',
)

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-audio-sound-smoke-'))
try {
  const sourcePath = path.join(tempDir, 'source.wav')
  await writeFile(sourcePath, 'not-real-audio-for-path-safety', 'utf8')
  const loudnessCommand = buildFFmpegAudioLoudnessCommand({
    sourceAudioLocalPath: sourcePath,
    ffmpegBin: 'ffmpeg',
    timeoutMs: 1000,
    operation: 'loudness_probe',
    runMode: 'local_dev',
  })
  check(loudnessCommand.args.includes('loudnorm=I=-16:TP=-1:LRA=11:print_format=json'), 'FFmpeg audio adapter must build allowlisted loudness command.')
  check(!loudnessCommand.args.some((arg) => arg.includes('concat') || arg.includes('http://')), 'FFmpeg audio command must not include arbitrary unsafe args.')

  await expectRejects(
    () => validateFFmpegAudioInput({
      sourceAudioLocalPath: sourcePath,
      ffmpegBin: 'ffmpeg',
      timeoutMs: 1000,
      operation: 'loudness_probe',
      runMode: 'local_dev',
      arbitraryArgs: ['-filter_complex', 'anything'],
    }),
    'FFmpeg audio adapter must reject arbitrary args.',
  )

  await expectRejects(
    () => buildFFmpegAudioNormalizeCommand({
      sourceAudioLocalPath: sourcePath,
      outputAudioLocalPath: sourcePath,
      safeOutputRoot: tempDir,
      ffmpegBin: 'ffmpeg',
      timeoutMs: 1000,
      operation: 'normalize_audio',
      runMode: 'local_dev',
    }),
    'FFmpeg audio adapter must refuse source overwrite.',
  )

  const mockAnalysis = buildAnalysis({ noiseLevel: 0.35, speechPresence: 'present' })
  const summary = buildAudioAnalysisSummary({
    mode: 'dry_run',
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    mockAnalysis,
  })
  check(!summary.advancedAnalysisRan, 'Audio analysis adapter must not claim advanced analysis when only mock data exists.')
  check(summary.issues.some((issue) => issue.code === 'advanced_audio_analysis_not_run'), 'Audio analysis adapter must record placeholder analysis issue.')

  const mildVoice = chooseVoiceCleanupStrength({ analysis: summary })
  check(mildVoice.cleanupStrength === 'light', 'Voice cleanup policy must choose light cleanup for mild noise.')

  const clippingAnalysis = buildAnalysis({ clippingDetected: true, speechPresence: 'present', noiseLevel: 0.8 })
  const clippingVoice = chooseVoiceCleanupStrength({ analysis: clippingAnalysis })
  check(clippingVoice.cleanupStrength === 'light' && clippingVoice.naturalnessRisk === 'high', 'Voice cleanup policy must avoid aggressive denoise for clipping.')

  const cleanupPlan = buildAudioCleanupPlan({
    workspaceId: 'workspace-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    audioAnalysis: summary,
  })
  check(cleanupPlan.selectedPrimaryTool !== 'deepfilternet' || cleanupPlan.cleanupStrength !== 'strong', 'Audio cleanup plan must start gentle.')
  check(!cleanupPlan.fallbackTools.includes('demucs'), 'Audio cleanup plan must not choose Demucs for every video.')

  const noOverlap = evaluateMusicSpeechOverlap({ analysis: buildAnalysis({ musicDetected: true, musicSpeechOverlap: false }) })
  check(noOverlap.recommendation === 'leave_music', 'Music/speech policy must leave music alone when no overlap exists.')

  const overlap = evaluateMusicSpeechOverlap({
    analysis: buildAnalysis({ musicDetected: true, musicSpeechOverlap: true, advancedAnalysisRan: true }),
    explicitOverlapRanges: [{ startSeconds: 1, endSeconds: 4 }],
  })
  check(overlap.recommendation === 'duck_music', 'Music/speech overlap policy must plan ducking when overlap exists.')

  const ducking = buildMusicDuckingPlan({ finding: overlap })
  check(ducking.enabled && ducking.voiceFirst && ducking.duckingDb < 0, 'Music ducking plan must use voice-first rule.')

  const sfx = buildSfxDensityPlan({ requestedDensity: 'heavy' })
  check(!sfx.randomSfxAllowed && sfx.maxSfxPerMinute <= 10, 'SFX density policy must reject random excessive SFX.')

  const soundSync = buildSoundSyncCuePlan({
    audioAnalysis: buildAnalysis({ silenceSegments: [{ startSeconds: 5, endSeconds: 6.2, confidence: 0.6 }] }),
    captionSegments: [{
      captionId: 'caption-audio-smoke',
      startSeconds: 0,
      endSeconds: 1,
      text: 'Audio should protect speech.',
      lines: ['Audio should protect speech.'],
      words: [],
      styleHints: { presetId: 'clean_subtitle', placement: 'bottom_safe', emphasisWords: [] },
    }],
  })
  check(soundSync.cues.every((cue) => cue.reason.length > 0), 'SoundSync cue planner must create cues with reasons.')
  check(soundSync.cues.some((cue) => cue.cueType === 'emotional_pause'), 'SoundSync cue planner must preserve emotional pause cues.')
  check(!soundSync.beatDetectionRan, 'SoundSync cue planner must not claim beat detection in M9.')

  const loudness = buildLoudnessNormalizationPlan({ analysis: summary, platform: 'social' })
  check(loudness.targetLufs === -16 && loudness.truePeakDb === -1, 'Loudness normalization policy must create target/true-peak plan.')

  const artifacts = buildAudioFoundationArtifacts({
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    includeCleanedAudio: true,
    includeSeparatedStem: true,
  })
  check(artifacts.every((artifact) => artifact.isPrivate && !artifact.storageObjectPath.toLowerCase().includes('signature=')), 'Audio artifact builder must create private storage refs.')

  const qa = buildAudioQAResults({
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    audioAnalysis: summary,
    cleanupPlan,
    loudnessPlan: loudness,
    duckingPlan: ducking,
  })
  check(qa.qualityGateResults.some((gate) => gate.gateType === 'audio_loudness'), 'Audio QA builder must emit audio_loudness gate.')
  check(qa.qualityGateResults.some((gate) => gate.gateType === 'audio_naturalness'), 'Audio QA builder must emit audio_naturalness gate.')
  check(qa.qualityGateResults.some((gate) => gate.gateType === 'music_over_voice'), 'Audio QA builder must emit music_over_voice gate.')

  check(buildDeepFilterNetSkipReason({ runMode: 'local_dev', timeoutMs: 1000 })?.code === 'deepfilternet_not_enabled', 'DeepFilterNet adapter must skip gracefully if unavailable/no model.')
  check(buildRNNoiseSkipReason({ runMode: 'local_dev', timeoutMs: 1000 })?.code === 'rnnoise_not_enabled', 'RNNoise adapter must skip gracefully if unavailable.')
  check(buildDemucsSkipReason({ runMode: 'local_dev', timeoutMs: 1000 })?.code === 'demucs_not_enabled', 'Demucs adapter must skip gracefully if unavailable/no model.')
  check(buildSoundTouchSkipReason({ runMode: 'local_dev', timeoutMs: 1000 })?.code === 'soundtouch_not_enabled', 'SoundTouch adapter must skip gracefully if unavailable.')
  check(buildSignalsmithStretchSkipReason({ runMode: 'local_dev', timeoutMs: 1000 })?.code === 'signalsmith_stretch_not_enabled', 'Signalsmith adapter must skip gracefully if unavailable.')

  const dryRun = await runAudioFoundation({
    mode: 'dry_run',
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    mockAnalysis,
  })
  check(dryRun.status === 'dry_run' && dryRun.qualityGateResults.length >= 4, 'Audio dry-run runner must work without FFmpeg/audio AI tools.')

  const localMissing = await runAudioFoundation({
    mode: 'local_dev',
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    sourceAudioLocalPath: path.join(tempDir, 'missing.wav'),
    localDevFfmpegLoudness: true,
    mockAnalysis,
  })
  check(localMissing.skipReasons.some((reason) => reason.code === 'local_audio_missing'), 'local-dev FFmpeg loudness must skip gracefully if source/FFmpeg unavailable.')

  const fixtureResult = await createAudioFixture(tempDir)
  if (fixtureResult.ok) {
    const localRun = await runAudioFoundation({
      mode: 'local_dev',
      workspaceId: 'workspace-audio-smoke',
      projectId: 'project-audio-smoke',
      mediaAssetId: 'media-audio-smoke',
      sourceAudioLocalPath: fixtureResult.audioPath,
      localDevFfmpegLoudness: true,
      ffmpegBin: 'ffmpeg',
      timeoutMs: 15_000,
      mockAnalysis,
    })
    check(localRun.status === 'partial', 'local-dev FFmpeg fixture should run against generated temp audio when available.')
  }

  const blocked = await runAudioFoundation({
    mode: 'production_blocked',
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
  })
  check(blocked.status === 'blocked', 'Production-blocked mode must refuse real cleanup/separation.')

  await expectRejects(
    () => runAudioFoundation({
      mode: 'dry_run',
      workspaceId: 'workspace-audio-smoke',
      projectId: 'project-audio-smoke',
      mediaAssetId: 'media-audio-smoke',
      workerPayload: buildPayload('cpu_analysis_worker', { rawPrompt: 'clean the audio from chat' }),
    }),
    'Audio runner must reject raw prompt payload fields.',
  )

  await expectRejects(
    () => runAudioFoundation({
      mode: 'dry_run',
      workspaceId: 'workspace-audio-smoke',
      projectId: 'project-audio-smoke',
      mediaAssetId: 'media-audio-smoke',
      workerPayload: buildPayload('qa_worker', undefined, ['https://storage.googleapis.com/audio.wav?X-Goog-Signature=abc'], ['ffmpeg']),
    }),
    'Audio runner must reject signed URL payload fields.',
  )

  const cpuRouted = await runProductionWorkerRuntime({
    payload: buildPayload('cpu_analysis_worker', {
      audioFoundation: {
        mode: 'dry_run',
        mockAnalysis: { noiseLevel: 0.3, speechPresence: 'present' },
      },
  }, ['workspaces/workspace-audio-smoke/projects/project-audio-smoke/audio/source.wav'], ['audioflux']),
  })
  check(cpuRouted.status === 'completed' && cpuRouted.output?.futureHandler === 'cpu_analysis_worker_audio_foundation', 'CPU worker must route explicit audioFoundation dry-run.')

  const gpuRouted = await runProductionWorkerRuntime({
    payload: buildPayload('gpu_ai_worker', {
      audioFoundation: {
        mode: 'dry_run',
        mockAnalysis: { noiseLevel: 0.8, speechPresence: 'present' },
      },
    }, ['workspaces/workspace-audio-smoke/projects/project-audio-smoke/audio/source.wav'], ['deepfilternet']),
  })
  check(gpuRouted.status === 'completed' && gpuRouted.output?.futureHandler === 'gpu_ai_worker_audio_foundation', 'GPU worker must route explicit audioFoundation model-tool dry-run.')

  const qaRouted = await runProductionWorkerRuntime({
    payload: buildPayload('qa_worker', {
      audioFoundation: {
        mode: 'dry_run',
        mockAnalysis: { musicDetected: true, musicSpeechOverlap: true, speechPresence: 'present' },
      },
  }, ['workspaces/workspace-audio-smoke/projects/project-audio-smoke/audio/source.wav'], []),
  })
  check(qaRouted.status === 'completed' && qaRouted.output?.futureHandler === 'qa_worker_audio_foundation', 'QA worker must route explicit audioFoundation dry-run.')

  const combined = JSON.stringify({ dryRun, localMissing, blocked, cpuRouted, gpuRouted, qaRouted }).toLowerCase()
  check(!combined.includes('revideo'), 'Audio/sound foundation must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'signed_url_rejected',
      'path_traversal_rejected',
      'ffmpeg_loudness_allowlisted',
      'ffmpeg_arbitrary_args_rejected',
      'source_overwrite_rejected',
      'mock_analysis_honest',
      'light_cleanup_for_mild_noise',
      'clipping_avoids_aggressive_denoise',
      'demucs_not_default',
      'ducking_only_for_overlap',
      'voice_first_ducking',
      'sfx_density_policy',
      'soundsync_cues',
      'loudness_target',
      'private_audio_artifacts',
      'audio_qa_gates',
      'adapter_skip_behavior',
      'dry_run_without_tools',
      'local_dev_ffmpeg_skip_or_fixture',
      'production_blocked',
      'raw_prompt_signed_url_rejected',
      'explicit_worker_routes',
      'no_revideo',
    ],
    fixtureMode: fixtureResult.ok ? 'processed' : 'skipped',
  }))
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

function buildAnalysis(input: Partial<AudioAnalysisSummary> = {}): AudioAnalysisSummary {
  return {
    durationSeconds: input.durationSeconds ?? 12,
    peakDb: input.peakDb,
    integratedLufs: input.integratedLufs,
    truePeakDb: input.truePeakDb,
    clippingDetected: input.clippingDetected ?? false,
    silenceSegments: input.silenceSegments ?? [],
    noiseLevel: input.noiseLevel,
    speechPresence: input.speechPresence ?? 'unknown',
    musicDetected: input.musicDetected ?? false,
    musicSpeechOverlap: input.musicSpeechOverlap ?? false,
    energyCurveArtifactId: input.energyCurveArtifactId,
    advancedAnalysisRan: input.advancedAnalysisRan ?? false,
    issues: input.issues ?? [],
  }
}

async function createAudioFixture(tempDir: string): Promise<{ ok: true; audioPath: string } | { ok: false }> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 5_000, windowsHide: true, maxBuffer: 512 * 1024 })
    const audioPath = path.join(tempDir, 'fixture-audio.wav')
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=1',
      '-c:a',
      'pcm_s16le',
      audioPath,
    ], { timeout: 15_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 })
    return { ok: true, audioPath }
  } catch {
    return { ok: false }
  }
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata?: Record<string, unknown>,
  storageReferenceIds = ['workspaces/workspace-audio-smoke/projects/project-audio-smoke/audio/source.wav'],
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds'] = ['ffmpeg'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `prod-audio-sound-${workerType}`,
    workspaceId: 'workspace-audio-smoke',
    projectId: 'project-audio-smoke',
    mediaAssetId: 'media-audio-smoke',
    approvedSnapshotId: 'approved-snapshot-audio-smoke',
    editPlanId: 'edit-plan-audio-smoke',
    toolExecutionPlanId: 'tool-execution-audio-smoke',
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds,
    requestedRecipeIds: ['audio_cleanup_recipe'],
    storageReferenceIds,
    createdAt: new Date().toISOString(),
    metadata,
  }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
