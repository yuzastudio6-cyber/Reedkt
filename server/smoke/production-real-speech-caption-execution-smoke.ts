import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildFasterWhisperExecutionCommand,
  normalizeFasterWhisperExecutionResult,
  runSpeechExecution,
  validateSpeechExecutionPolicy,
} from '../workers/speech'
import {
  runCaptionExecution,
  sanitizeAssText,
} from '../workers/captions'
import {
  runSpeechCaptionExecutionPipeline,
} from '../workers/speech-caption'
import type { SpeechExecutionInput } from '../workers/speech-caption'

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
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

const baseSpeechInput: SpeechExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  approvedSnapshotId: 'approved-snapshot-m13-smoke',
  toolExecutionPlanId: 'tool-execution-m13-smoke',
  idempotencyKey: 'idempotency-m13-smoke',
  sourceAudioArtifactId: 'audio-artifact-m13-smoke',
  device: 'cpu',
  wordTimestamps: true,
  vadFilter: true,
  timeoutMs: 1000,
  enableRealTranscription: false,
  allowModelDownload: false,
}

await expectRejects(
  () => validateSpeechExecutionPolicy({ ...baseSpeechInput, rawPrompt: 'do this' } as SpeechExecutionInput & { rawPrompt: string }),
  'Speech execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateSpeechExecutionPolicy({ ...baseSpeechInput, signedUrl: 'https://storage.example/audio.wav?X-Goog-Signature=abc' } as SpeechExecutionInput & { signedUrl: string }),
  'Speech execution policy must reject signedUrl.',
)
await expectRejects(
  () => validateSpeechExecutionPolicy({ ...baseSpeechInput, allowModelDownload: true }),
  'Speech execution policy must reject allowModelDownload=true.',
)

const productionPolicy = validateSpeechExecutionPolicy({
  ...baseSpeechInput,
  mode: 'production_ready',
  modelWeightManifestId: undefined,
})
check(!productionPolicy.allowed, 'Production speech execution must block without approved modelWeightManifestId.')
check(productionPolicy.blockingReasons.some((reason) => reason.includes('model')), 'Production speech execution must report model-weight blockers.')

const unknownWeightPolicy = validateSpeechExecutionPolicy({
  ...baseSpeechInput,
  mode: 'production_ready',
  modelWeightManifestId: 'faster_whisper_model',
})
check(!unknownWeightPolicy.allowed, 'Unknown/non-commercial faster-whisper model weights must block production.')
check(unknownWeightPolicy.blockingReasons.some((reason) => reason.toLowerCase().includes('unknown') || reason.toLowerCase().includes('commercial')), 'Unknown/non-commercial model weights must be named in blockers.')

const speechDryRun = await runSpeechExecution(baseSpeechInput)
check(speechDryRun.status === 'dry_run', 'Dry-run speech execution must work without faster-whisper.')
check(Boolean(speechDryRun.transcript), 'Dry-run speech execution must produce transcript payload.')
check(Boolean(speechDryRun.wordTimestamps), 'Dry-run speech execution must produce word timestamp payload.')
check(speechDryRun.artifacts.some((artifact) => artifact.artifactType === 'transcript_json'), 'Transcript artifact must be emitted.')
check(speechDryRun.artifacts.some((artifact) => artifact.artifactType === 'word_timestamps_json'), 'Word timestamp artifact must be emitted.')
check(speechDryRun.artifacts.every((artifact) => artifact.isPrivate && !artifact.storageObjectPath.toLowerCase().includes('signed')), 'Speech execution artifacts must be private storage refs.')

const localDevSkip = await runSpeechExecution({
  ...baseSpeechInput,
  mode: 'local_dev',
  enableRealTranscription: true,
  sourceAudioLocalPath: 'missing-audio.wav',
  localModelPath: 'missing-model',
  outputDirectory: 'tmp-missing-output',
})
check(localDevSkip.status === 'skipped', 'local_dev real transcription must skip when tool/model inputs are unavailable.')
check(localDevSkip.skippedReasons.some((reason) => reason.code === 'local_audio_missing'), 'local_dev skip reason must be explicit.')

const commandPlan = buildFasterWhisperExecutionCommand({
  ...baseSpeechInput,
  mode: 'local_dev',
  sourceAudioLocalPath: 'audio.wav',
  localModelPath: 'models/faster-whisper',
  outputDirectory: 'tmp-output',
  enableRealTranscription: true,
})
check(commandPlan.args.includes('--model'), 'faster-whisper command must use allowlisted model arg.')
check(commandPlan.args.includes('--word_timestamps'), 'faster-whisper command must include word timestamp arg when requested.')
check(!commandPlan.args.join(' ').toLowerCase().includes('download'), 'faster-whisper command must not include model download args.')
await expectRejects(
  () => buildFasterWhisperExecutionCommand({
    ...baseSpeechInput,
    mode: 'local_dev',
    sourceAudioLocalPath: 'audio.wav',
    localModelPath: 'models/faster-whisper',
    outputDirectory: 'tmp-output',
    arbitraryArgs: ['--download-model'],
  }),
  'faster-whisper command builder must reject arbitrary args.',
)

const parsed = normalizeFasterWhisperExecutionResult(JSON.stringify({
  language: 'en',
  segments: [{
    id: 'seg-1',
    start: 0,
    end: 1.2,
    text: 'Hello world',
    confidence: 0.91,
    words: [
      { word: 'Hello', start: 0, end: 0.5, probability: 0.9 },
      { word: 'world', start: 0.5, end: 1.2, probability: 0.92 },
    ],
  }],
}))
check(parsed.segments.length === 1 && parsed.words.length === 2, 'faster-whisper parser must normalize valid mock output.')
await expectRejects(
  () => normalizeFasterWhisperExecutionResult(JSON.stringify({ segments: [{ start: -1, end: 1, text: 'bad' }] })),
  'faster-whisper parser must reject negative timestamps.',
)
await expectRejects(
  () => normalizeFasterWhisperExecutionResult(JSON.stringify({ segments: [{ start: 2, end: 1, text: 'bad' }] })),
  'faster-whisper parser must reject end-before-start timestamps.',
)

const captionExecution = await runCaptionExecution({
  mode: 'dry_run',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  toolExecutionPlanId: 'tool-execution-m13-smoke',
  transcript: speechDryRun.transcript,
  wordTimestamps: speechDryRun.wordTimestamps,
  buildSrt: true,
  buildWebVtt: true,
  buildAss: true,
})
check(captionExecution.captionSegments.length > 0, 'Caption execution must build caption segments from mock word timestamps.')
check(captionExecution.captionFiles.some((file) => file.format === 'srt' && /\d\d:\d\d:\d\d,\d\d\d -->/.test(file.text)), 'Caption execution must create valid SRT output.')
check(captionExecution.captionFiles.some((file) => file.format === 'webvtt' && file.text.startsWith('WEBVTT')), 'Caption execution must create valid WebVTT output.')
check(captionExecution.captionFiles.some((file) => file.format === 'ass' && file.text.includes('[V4+ Styles]')), 'Caption execution must create valid ASS output.')
await expectRejects(
  () => sanitizeAssText('{\\move(1,1,2,2)}unsafe'),
  'ASS output must reject unsafe override tags.',
)
for (const gateType of ['transcript_alignment', 'caption_timing', 'caption_readability', 'caption_safe_zone'] as const) {
  check(captionExecution.qaResults.some((gate) => gate.gateType === gateType), `Caption QA must emit ${gateType}.`)
}
check(captionExecution.artifacts.every((artifact) => artifact.isPrivate && !artifact.storageObjectPath.toLowerCase().includes('signed')), 'Caption artifacts must be private storage refs.')

const previewSkip = await runCaptionExecution({
  mode: 'local_dev',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  transcript: speechDryRun.transcript,
  wordTimestamps: speechDryRun.wordTimestamps,
  buildPreview: true,
  enableCaptionPreview: false,
})
check(previewSkip.skippedReasons.some((reason) => reason.code === 'caption_preview_disabled'), 'Caption preview must skip gracefully when disabled.')

const pipelineDryRun = await runSpeechCaptionExecutionPipeline({
  mode: 'dry_run',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  approvedSnapshotId: 'approved-snapshot-m13-smoke',
  toolExecutionPlanId: 'tool-execution-m13-smoke',
  idempotencyKey: 'idempotency-m13-smoke',
  sourceAudioArtifactId: 'audio-artifact-m13-smoke',
})
check(pipelineDryRun.status === 'dry_run' || pipelineDryRun.status === 'completed', 'Pipeline dry-run must return a structured result.')
check(pipelineDryRun.transcriptArtifacts.length >= 2, 'Pipeline dry-run must return transcript artifacts.')
check(pipelineDryRun.captionArtifacts.length >= 4, 'Pipeline dry-run must return caption artifacts.')
check(pipelineDryRun.qaResults.some((gate) => gate.gateType === 'transcript_alignment'), 'Pipeline must include transcript alignment QA.')

const pipelineBlocked = await runSpeechCaptionExecutionPipeline({
  mode: 'production_blocked',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  sourceAudioArtifactId: 'audio-artifact-m13-smoke',
})
check(pipelineBlocked.status === 'blocked', 'production_blocked mode must refuse real transcription/render.')

const pipelineProductionReady = await runSpeechCaptionExecutionPipeline({
  mode: 'production_ready',
  workspaceId: 'workspace-m13-smoke',
  projectId: 'project-m13-smoke',
  mediaAssetId: 'media-m13-smoke',
  approvedSnapshotId: 'approved-snapshot-m13-smoke',
  toolExecutionPlanId: 'tool-execution-m13-smoke',
  idempotencyKey: 'idempotency-m13-smoke',
  sourceAudioArtifactId: 'audio-artifact-m13-smoke',
  modelWeightManifestId: 'faster_whisper_model',
})
check(pipelineProductionReady.status === 'blocked', 'production_ready must remain blocked while readiness/model-weight blockers exist.')

await expectRejects(
  () => runSpeechCaptionExecutionPipeline({
    mode: 'dry_run',
    workspaceId: 'workspace-m13-smoke',
    projectId: 'project-m13-smoke',
    mediaAssetId: 'media-m13-smoke',
    sourceAudioArtifactId: 'audio-artifact-m13-smoke',
    rawPrompt: 'from chat',
  } as Parameters<typeof runSpeechCaptionExecutionPipeline>[0] & { rawPrompt: string }),
  'Pipeline must reject raw prompt fields.',
)

const routed = await runProductionWorkerRuntime({
  payload: buildPayload('gpu_ai_worker', {
    speechCaptionExecution: {
      mode: 'dry_run',
      sourceAudioArtifactId: 'audio-artifact-m13-smoke',
    },
  }, ['workspaces/workspace-m13-smoke/projects/project-m13-smoke/audio/audio.wav'], ['faster_whisper']),
})
check(routed.status === 'completed', 'Explicit speechCaptionExecution worker route must complete in dry-run.')
check(routed.output?.futureHandler === 'gpu_ai_worker_speech_caption_execution', 'Worker router must use explicit speechCaptionExecution route.')

const combined = JSON.stringify({
  speechDryRun,
  captionExecution,
  pipelineDryRun,
}).toLowerCase()
check(!combined.includes('revideo'), 'M13 speech/caption execution must not use Revideo.')
check(!combined.includes('providerapikey') && !combined.includes('provider_api_key'), 'M13 speech/caption execution must not call providers.')
check(!String(routed.output?.futureHandler).toLowerCase().includes('revideo'), 'M13 worker route must not use Revideo.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'policy_raw_prompt_rejected',
    'policy_signed_url_rejected',
    'allow_model_download_rejected',
    'production_model_weight_blocked',
    'dry_run_without_faster_whisper',
    'local_dev_skip_safe',
    'allowlisted_command',
    'arbitrary_args_rejected',
    'parser_valid_output',
    'parser_invalid_timestamps',
    'private_transcript_artifacts',
    'private_caption_artifacts',
    'caption_segments_files_and_qa',
    'preview_skip_safe',
    'pipeline_dry_run',
    'production_blocked',
    'production_ready_blocked',
    'worker_route',
    'no_revideo',
    'no_providers',
  ],
  transcriptArtifacts: pipelineDryRun.transcriptArtifacts.length,
  captionArtifacts: pipelineDryRun.captionArtifacts.length,
  qaResults: pipelineDryRun.qaResults.length,
}, null, 2))

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata?: Record<string, unknown>,
  storageReferenceIds = ['workspaces/workspace-m13-smoke/projects/project-m13-smoke/source/source.wav'],
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds'] = workerType === 'gpu_ai_worker' ? ['faster_whisper'] : ['remotion'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `prod-real-speech-caption-${workerType}`,
    workspaceId: 'workspace-m13-smoke',
    projectId: 'project-m13-smoke',
    mediaAssetId: 'media-m13-smoke',
    approvedSnapshotId: 'approved-snapshot-m13-smoke',
    editPlanId: 'edit-plan-m13-smoke',
    toolExecutionPlanId: 'tool-execution-m13-smoke',
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds,
    requestedRecipeIds: ['transcript_recipe', 'caption_recipe'],
    storageReferenceIds,
    createdAt: new Date().toISOString(),
    metadata,
  }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
