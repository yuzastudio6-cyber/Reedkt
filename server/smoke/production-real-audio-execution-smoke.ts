import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildAudioExecutionArtifactRecord,
  buildAudioExecutionPlan,
  buildFFmpegLoudnessExecutionCommand,
  buildFFmpegNormalizationExecutionCommand,
  buildSoundSyncCueArtifact,
  runAudioCleanupExecution,
  validateAudioExecutionInput,
  validateAudioExecutionPolicy,
} from '../workers/audio'
import type { AudioCleanupPlan, AudioExecutionInput } from '../workers/audio'
import { runAudioExecutionPipeline } from '../workers/audio-execution'

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

const baseInput: AudioExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m15a-smoke',
  projectId: 'project-m15a-smoke',
  mediaAssetId: 'media-m15a-smoke',
  approvedSnapshotId: 'approved-snapshot-m15a-smoke',
  toolExecutionPlanId: 'tool-execution-m15a-smoke',
  idempotencyKey: 'idempotency-m15a-smoke',
  sourceAudioArtifactId: 'audio-artifact-m15a-smoke',
  sourceAudioStorageObjectPath: 'workspaces/workspace-m15a-smoke/projects/project-m15a-smoke/audio/extracted.wav',
  audioAnalysis: {
    durationSeconds: 6,
    peakDb: -2,
    integratedLufs: -23,
    truePeakDb: -1.5,
    clippingDetected: false,
    silenceSegments: [],
    noiseLevel: 0.22,
    speechPresence: 'present',
    musicDetected: true,
    musicSpeechOverlap: true,
    advancedAnalysisRan: true,
    issues: [],
  },
  musicDuckingPlan: {
    enabled: true,
    duckingDb: -6,
    attackMs: 120,
    releaseMs: 350,
    reason: 'Approved voice-first overlap fixture.',
    voiceFirst: true,
    warnings: [],
  },
  soundSyncCuePlan: {
    cues: [{
      cueId: 'cue-m15a-smoke-plan',
      cueType: 'music_duck',
      timeSeconds: 0.5,
      durationSeconds: 1.2,
      reason: 'Approved voice-first overlap cue.',
      confidence: 0.8,
      source: 'manual_metadata',
    }],
    beatDetectionRan: false,
    warnings: [],
  },
}

await expectRejects(
  () => validateAudioExecutionPolicy({ ...baseInput, rawPrompt: 'clean this audio' }),
  'Audio execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateAudioExecutionPolicy({ ...baseInput, signedUrl: 'https://storage.example/audio.wav?X-Goog-Signature=abc' }),
  'Audio execution policy must reject signedUrl.',
)
const arbitraryPolicy = validateAudioExecutionPolicy({ ...baseInput, arbitraryFfmpegArgs: ['-filter_complex', 'unsafe'] })
check(!arbitraryPolicy.allowed && arbitraryPolicy.blockingReasons.includes('arbitrary_ffmpeg_args_blocked'), 'Audio policy must reject arbitrary FFmpeg args.')
const downloadPolicy = validateAudioExecutionPolicy({ ...baseInput, allowModelDownload: true })
check(!downloadPolicy.allowed && downloadPolicy.blockingReasons.includes('model_download_blocked'), 'Audio policy must reject allowModelDownload=true.')
const finalMuxPolicy = validateAudioExecutionPolicy({ ...baseInput, allowFinalMux: true })
check(!finalMuxPolicy.allowed && finalMuxPolicy.blockingReasons.includes('final_mux_blocked_in_m15a'), 'Audio policy must reject allowFinalMux=true.')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-m15a-smoke-'))
try {
  const overwriteInput = {
    ...baseInput,
    mode: 'local_dev' as const,
    sourceAudioLocalPath: path.join(tempRoot, 'normalized-audio.wav'),
    outputDirectory: tempRoot,
  }
  check(!validateAudioExecutionInput(overwriteInput).valid, 'Audio validator must reject source overwrite.')
  check(!validateAudioExecutionInput({
    ...baseInput,
    loudnessPlan: {
      targetLufs: -3,
      truePeakDb: -1,
      shouldNormalize: true,
      reason: 'bad target',
      warnings: [],
    },
  }).valid, 'Audio validator must reject unsafe loudness target.')

  const demucsPlan = buildMockCleanupPlan({ selectedPrimaryTool: 'none', fallbackTools: ['demucs'] })
  check(!validateAudioExecutionInput({
    ...baseInput,
    audioAnalysis: { ...baseInput.audioAnalysis!, musicSpeechOverlap: false },
    audioCleanupPlan: demucsPlan,
  }).valid, 'Audio validator must reject Demucs when no music/speech overlap or approved reason exists.')

  const executionPlan = buildAudioExecutionPlan({ ...baseInput, audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'ffmpeg' }) })
  check(executionPlan.selectedOperations.includes('analyze_loudness'), 'Audio execution plan must include loudness analysis.')
  check(executionPlan.selectedOperations.includes('normalize_loudness'), 'Audio execution plan must include normalization when target is missed.')
  check(executionPlan.selectedOperations.includes('clean_voice_ffmpeg_basic'), 'Audio execution plan must include cleanup operation.')
  check(executionPlan.selectedOperations.includes('duck_music_under_voice'), 'Audio execution plan must include music ducking when overlap exists.')
  check(executionPlan.selectedOperations.includes('generate_soundsync_cues'), 'Audio execution plan must include SoundSync cue metadata.')
  check(executionPlan.selectedOperations.includes('qa_audio'), 'Audio execution plan must include audio QA.')
  check(executionPlan.finalMuxAllowed === false, 'Audio execution plan must never allow final mux.')

  const loudnessCommand = buildFFmpegLoudnessExecutionCommand({ ...baseInput, sourceAudioLocalPath: path.join(tempRoot, 'source.wav') })
  check(loudnessCommand.args.includes('loudnorm=I=-16:TP=-1:LRA=11:print_format=json'), 'FFmpeg loudness command must use allowlisted loudnorm args.')
  check(!loudnessCommand.args.join(' ').includes('filter_complex'), 'FFmpeg loudness command must not include arbitrary args.')
  const normalizationCommand = buildFFmpegNormalizationExecutionCommand({ executionInput: baseInput, executionPlan })
  check(normalizationCommand.args.some((arg) => arg.includes('loudnorm=I=')), 'FFmpeg normalization command must use allowlisted loudnorm args.')
  check(!normalizationCommand.args.join(' ').includes('filter_complex'), 'FFmpeg normalization command must not include arbitrary args.')

  const dryRun = await runAudioExecutionPipeline({ ...baseInput, audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'ffmpeg' }) })
  check(dryRun.status === 'dry_run', 'Dry-run audio execution must work without FFmpeg.')
  check(Boolean(dryRun.executionPlan), 'Dry-run audio execution must build an execution plan.')
  check(dryRun.artifacts.some((artifact) => artifact.artifactType === 'audio_analysis_json'), 'Dry-run audio execution must create analysis artifact metadata.')
  check(dryRun.artifacts.some((artifact) => artifact.artifactType === 'qa_report'), 'Dry-run audio execution must create QA artifact metadata.')

  const localSkip = await runAudioExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    sourceAudioLocalPath: path.join(tempRoot, 'missing.wav'),
    outputDirectory: tempRoot,
    enableFfmpegAudioExecution: true,
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'ffmpeg' }),
  })
  check(localSkip.skippedReasons.some((reason) => reason.code === 'local_audio_missing'), 'local_dev FFmpeg execution must skip gracefully when source is missing.')

  const ffmpegFixtureStatus = await maybeRunGeneratedFfmpegFixture(tempRoot)

  const deepFilterPlan = buildAudioExecutionPlan({
    ...baseInput,
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'deepfilternet' }),
  })
  const deepFilterResult = await runAudioCleanupExecution({
    executionInput: {
      ...baseInput,
      mode: 'local_dev',
      enableModelAudioExecution: true,
      audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'deepfilternet' }),
    },
    executionPlan: deepFilterPlan,
  })
  check(deepFilterResult.skipReasons.some((reason) => reason.tool === 'deepfilternet'), 'DeepFilterNet execution must skip if unavailable/unapproved/no model.')

  const rnnoisePlan = buildAudioExecutionPlan({
    ...baseInput,
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'rnnoise' }),
  })
  const rnnoiseResult = await runAudioCleanupExecution({
    executionInput: {
      ...baseInput,
      mode: 'local_dev',
      enableModelAudioExecution: true,
      audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'rnnoise' }),
    },
    executionPlan: rnnoisePlan,
  })
  check(rnnoiseResult.skipReasons.some((reason) => reason.tool === 'rnnoise'), 'RNNoise execution must skip if unavailable.')

  const demucsExecutionPlan = buildAudioExecutionPlan({
    ...baseInput,
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'none', fallbackTools: ['demucs'] }),
  })
  const demucsResult = await runAudioCleanupExecution({
    executionInput: {
      ...baseInput,
      mode: 'local_dev',
      enableModelAudioExecution: true,
      approvedDemucsReason: 'Music/speech overlap confirmed by approved plan.',
      audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'none', fallbackTools: ['demucs'] }),
    },
    executionPlan: demucsExecutionPlan,
  })
  check(demucsResult.skipReasons.some((reason) => reason.tool === 'demucs'), 'Demucs execution must skip if unavailable/unapproved/no model.')

  const productionModel = await runAudioExecutionPipeline({
    ...baseInput,
    mode: 'production_ready',
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'deepfilternet' }),
    modelWeightManifestIds: [],
    readinessReport: { overallStatus: 'passed', blockers: [], blockerSummaries: [] },
  })
  check(productionModel.status === 'blocked', 'Model-based audio execution must block production without approved model weights.')

  const cleanedRecord = buildAudioExecutionArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'cleaned_audio',
    fileName: 'cleaned-audio.wav',
    contentType: 'audio/wav',
  })
  check(cleanedRecord.isPrivate && cleanedRecord.artifactType === 'cleaned_audio', 'Audio artifact writer must create private cleaned_audio refs.')
  check(!cleanedRecord.storageObjectPath.toLowerCase().includes('signed'), 'Audio artifact writer must not create signed URLs.')

  const soundSyncArtifact = await buildSoundSyncCueArtifact({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    soundSyncCuePlan: {
      cues: [{
        cueId: 'cue-m15a-smoke',
        cueType: 'music_duck',
        timeSeconds: 1,
        durationSeconds: 1,
        reason: 'Voice starts under music.',
        confidence: 0.8,
        source: 'manual_metadata',
      }],
      beatDetectionRan: false,
      warnings: [],
    },
    mode: 'dry_run',
  })
  check(soundSyncArtifact.artifact.isPrivate && soundSyncArtifact.artifact.artifactType === 'audio_analysis_json', 'SoundSync artifact writer must create private metadata refs.')

  for (const gateType of ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'] as const) {
    check(dryRun.qaResults.some((gate) => gate.gateType === gateType), `Audio QA must emit ${gateType}.`)
  }

  const productionBlocked = await runAudioExecutionPipeline({ ...baseInput, mode: 'production_blocked' })
  check(productionBlocked.status === 'blocked', 'production_blocked must refuse real cleanup/separation.')
  const productionReady = await runAudioExecutionPipeline({
    ...baseInput,
    mode: 'production_ready',
    readinessReport: { overallStatus: 'blocked', blockers: ['ffmpeg_missing'], blockerSummaries: [] },
  })
  check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness/model-weight blockers exist.')

  const routed = await runProductionWorkerRuntime({
    payload: buildPayload('cpu_analysis_worker', {
      audioExecution: {
        mode: 'dry_run',
        sourceAudioArtifactId: baseInput.sourceAudioArtifactId,
        audioAnalysis: baseInput.audioAnalysis,
      },
    }),
  })
  check(routed.status === 'completed', 'Explicit audioExecution worker route must complete in dry-run.')
  check(routed.output?.futureHandler === 'cpu_analysis_worker_audio_execution', 'Worker router must use explicit M15A CPU audio route.')
  check(Boolean(routed.output?.audioExecutionResult), 'Worker router output must include audioExecutionResult.')

  const combinedOutput = JSON.stringify({ dryRun, productionBlocked, routed }).toLowerCase()
  check(!combinedOutput.includes('revideo'), 'M15A audio execution must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'policy_forbidden_fields',
      'validation_source_overwrite_loudness_demucs',
      'execution_plan_operations',
      'ffmpeg_command_plans_allowlisted',
      'dry_run_pipeline',
      'local_dev_ffmpeg_skip_safe',
      'model_adapter_skip_safe',
      'private_artifacts',
      'audio_qa_gates',
      'production_blockers',
      'worker_route',
      'no_revideo_runtime',
    ],
    ffmpegFixtureStatus,
    artifacts: dryRun.artifacts.length,
    qaResults: dryRun.qaResults.length,
  }, null, 2))
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

function buildMockCleanupPlan(input: {
  selectedPrimaryTool: AudioCleanupPlan['selectedPrimaryTool']
  fallbackTools?: AudioCleanupPlan['fallbackTools']
}): AudioCleanupPlan {
  return {
    id: 'cleanup-plan-m15a-smoke',
    cleanupStrength: input.selectedPrimaryTool === 'none' ? 'none' : 'light',
    selectedPrimaryTool: input.selectedPrimaryTool,
    fallbackTools: input.fallbackTools ?? [],
    operations: input.selectedPrimaryTool === 'none'
      ? []
      : [{
        operationId: `cleanup-${input.selectedPrimaryTool}`,
        toolId: input.selectedPrimaryTool,
        operationType: input.selectedPrimaryTool === 'ffmpeg' ? 'loudness_only' : 'noise_reduction',
        strength: 'light',
        reason: 'M15A smoke fixture cleanup operation.',
        risks: [],
      }],
    reasons: ['M15A smoke fixture cleanup plan.'],
    risks: [],
    expectedArtifacts: input.selectedPrimaryTool === 'none' ? ['audio_analysis_json', 'qa_report'] : ['cleaned_audio', 'audio_analysis_json', 'qa_report'],
    requiredQAGates: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
  }
}

async function maybeRunGeneratedFfmpegFixture(root: string): Promise<string> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000, maxBuffer: 512 * 1024, windowsHide: true })
  } catch {
    return 'ffmpeg_unavailable_skipped'
  }

  const source = path.join(root, 'generated-source.wav')
  try {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=1',
      '-ar',
      '48000',
      '-ac',
      '1',
      source,
    ], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true })
  } catch {
    return 'ffmpeg_available_fixture_generation_skipped'
  }

  const result = await runAudioExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    sourceAudioLocalPath: source,
    outputDirectory: root,
    enableFfmpegAudioExecution: true,
    timeoutMs: 20_000,
    audioCleanupPlan: buildMockCleanupPlan({ selectedPrimaryTool: 'ffmpeg' }),
  })
  check(result.loudnessResult?.status === 'completed' || result.loudnessResult?.status === 'failed', 'local_dev FFmpeg fixture should attempt loudness analysis when available.')
  check(result.normalizationResult?.status === 'completed' || result.normalizationResult?.status === 'failed', 'local_dev FFmpeg fixture should attempt normalization when available.')
  return `ffmpeg_fixture_${result.loudnessResult?.status}_${result.normalizationResult?.status}`
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata: ProductionWorkerJobPayload['metadata'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${workerType}-m15a-smoke`,
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    approvedSnapshotId: baseInput.approvedSnapshotId as string,
    toolExecutionPlanId: baseInput.toolExecutionPlanId as string,
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: workerType === 'gpu_ai_worker' ? ['deepfilternet'] : ['ffprobe'],
    requestedRecipeIds: ['audio_cleanup_recipe'],
    storageReferenceIds: [baseInput.sourceAudioStorageObjectPath as string],
    requiredQualityGateTypes: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
