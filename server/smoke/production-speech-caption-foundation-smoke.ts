import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildFasterWhisperSkipReason,
  detectFillerSegments,
  detectRepeatedTakeCandidates,
  normalizeTranscriptSegments,
  runSpeechFoundation,
} from '../workers/speech'
import type { TranscriptSegment } from '../workers/speech'
import {
  buildAssCaptionText,
  buildCaptionSegmentsFromTranscript,
  buildSrtCaptionText,
  buildWebVttCaptionText,
  chooseCaptionPlacement,
  runCaptionFoundation,
  sanitizeAssText,
  scoreCaptionReadability,
  scoreCaptionTiming,
} from '../workers/captions'
import { getCaptionStylePreset } from '../workers/captions'

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

const mockSegments = buildMockSegments()

await expectRejects(
  () => normalizeTranscriptSegments([{
    ...mockSegments[0] as TranscriptSegment,
    startSeconds: -0.1,
  }]),
  'Transcript normalizer must reject negative timestamps.',
)

await expectRejects(
  () => normalizeTranscriptSegments([{
    ...mockSegments[0] as TranscriptSegment,
    startSeconds: 2,
    endSeconds: 1,
  }]),
  'Transcript normalizer must reject end-before-start timestamps.',
)

const normalized = normalizeTranscriptSegments(mockSegments)
check(normalized[0]?.text === 'Um I think this take is ready.', 'Transcript normalizer must normalize spacing.')

const fillers = detectFillerSegments(normalized)
check(fillers.some((filler) => filler.label === 'um'), 'Filler detector must detect common fillers without removing them.')
check(normalized[0]?.text.toLowerCase().includes('um'), 'Filler detector must not remove transcript text.')

const repeated = detectRepeatedTakeCandidates(normalized)
check(repeated.length > 0, 'Repeated-take detector must find repeated phrases.')

const captions = buildCaptionSegmentsFromTranscript(normalized, {
  maxWordsPerCaption: 5,
  maxCharactersPerLine: 28,
})
check(captions.length > 0, 'Caption segment builder must create caption chunks.')
check(captions.every((caption) => caption.words.length > 0), 'Caption segments must preserve word references.')
check(captions.every((caption) => caption.endSeconds >= (caption.words.at(-1)?.endSeconds ?? caption.endSeconds)), 'Caption builder must avoid mid-word end splits.')
check(captions.every((caption) => caption.lines.length <= 2), 'Caption builder must default to readable two-line chunks.')

const timingWithOverlap = scoreCaptionTiming([
  captions[0] as (typeof captions)[number],
  { ...captions[0] as (typeof captions)[number], captionId: 'caption-overlap', startSeconds: 0.1, endSeconds: 0.2 },
])
check(timingWithOverlap.issues.some((issue) => issue.code === 'caption_overlap'), 'Caption timing QA must catch overlaps.')

const timingNegative = scoreCaptionTiming([{ ...captions[0] as (typeof captions)[number], startSeconds: -1 }])
check(timingNegative.issues.some((issue) => issue.code === 'caption_negative_timestamp'), 'Caption timing QA must catch negative timestamps.')

const readability = scoreCaptionReadability([{
  ...captions[0] as (typeof captions)[number],
  text: 'This caption is intentionally far too long and dense for a mobile subtitle line because it keeps going',
  lines: ['This caption is intentionally far too long and dense for a mobile subtitle line because it keeps going'],
  startSeconds: 0,
  endSeconds: 0.8,
  words: normalized.flatMap((segment) => segment.words),
}])
check(readability.issues.some((issue) => issue.code === 'caption_line_too_long'), 'Caption readability QA must catch overlong lines.')
check(readability.issues.some((issue) => issue.code === 'caption_words_per_second_high'), 'Caption readability QA must catch high words-per-second.')

const safeZone = chooseCaptionPlacement({})
check(safeZone.issues.some((issue) => issue.code === 'safe_zone_analysis_missing'), 'Safe-zone policy must warn when face/safe-zone analysis is missing.')
check(safeZone.issues.some((issue) => issue.code === 'ocr_text_regions_missing'), 'Safe-zone policy must warn when OCR analysis is missing.')

const srt = buildSrtCaptionText(captions)
check(/\d\d:\d\d:\d\d,\d\d\d --> \d\d:\d\d:\d\d,\d\d\d/.test(srt), 'SRT builder must output valid SRT timecodes.')

const webvtt = buildWebVttCaptionText(captions)
check(webvtt.startsWith('WEBVTT'), 'WebVTT builder must output WEBVTT header.')

const ass = buildAssCaptionText(captions, getCaptionStylePreset('clean_subtitle'))
check(ass.includes('[V4+ Styles]'), 'ASS builder must output controlled style section.')
await expectRejects(
  () => sanitizeAssText('{\\pos(1,1)}unsafe'),
  'ASS builder must reject unsafe override tag injection.',
)

const speechDryRun = await runSpeechFoundation({
  mode: 'dry_run',
  workspaceId: 'workspace-speech-smoke',
  projectId: 'project-speech-smoke',
  mediaAssetId: 'media-speech-smoke',
  sourceAudioArtifactId: 'audio-artifact-smoke',
  mockSegments: normalized,
})
check(speechDryRun.status === 'dry_run', 'Speech dry-run must pass without faster-whisper.')
check(speechDryRun.artifacts.every((artifact) => artifact.isPrivate && artifact.sourceOfTruth), 'Speech artifacts must be private source-of-truth refs.')
check(!JSON.stringify(speechDryRun.artifacts).toLowerCase().includes('signed'), 'Speech artifacts must not use signed URL refs.')

const captionDryRun = await runCaptionFoundation({
  mode: 'dry_run',
  workspaceId: 'workspace-speech-smoke',
  projectId: 'project-speech-smoke',
  mediaAssetId: 'media-speech-smoke',
  transcriptSegments: normalized,
})
check(captionDryRun.status === 'dry_run', 'Caption dry-run must pass without FFmpeg/libass.')
check(captionDryRun.captionFiles.some((file) => file.format === 'srt'), 'Caption dry-run must build SRT text.')
check(captionDryRun.captionFiles.some((file) => file.format === 'webvtt'), 'Caption dry-run must build WebVTT text.')
check(captionDryRun.captionFiles.some((file) => file.format === 'ass'), 'Caption dry-run must build ASS text.')
check(captionDryRun.artifacts.every((artifact) => artifact.isPrivate && artifact.sourceOfTruth), 'Caption artifacts must be private source-of-truth refs.')

const localWhisperSkip = buildFasterWhisperSkipReason({
  localAudioPath: 'missing-local-audio.wav',
  localModelPath: 'missing-local-model',
  device: 'cpu',
  wordTimestamps: true,
  vadFilter: true,
  timeoutMs: 1000,
  allowModelDownload: false,
  runMode: 'local_dev',
})
check(localWhisperSkip?.code === 'local_audio_missing', 'local-dev faster-whisper must skip gracefully when audio/model is unavailable.')

const captionLocalDevSkip = await runCaptionFoundation({
  mode: 'local_dev',
  workspaceId: 'workspace-speech-smoke',
  projectId: 'project-speech-smoke',
  mediaAssetId: 'media-speech-smoke',
  transcriptSegments: normalized,
})
check(captionLocalDevSkip.skipReasons.some((reason) => reason.code === 'caption_preview_source_missing'), 'local-dev caption preview must skip gracefully when FFmpeg/libass inputs are unavailable.')

const speechBlocked = await runSpeechFoundation({
  mode: 'production_blocked',
  workspaceId: 'workspace-speech-smoke',
  projectId: 'project-speech-smoke',
  mediaAssetId: 'media-speech-smoke',
  sourceAudioArtifactId: 'audio-artifact-smoke',
})
check(speechBlocked.status === 'blocked', 'production-blocked speech mode must refuse transcription.')

const captionBlocked = await runCaptionFoundation({
  mode: 'production_blocked',
  workspaceId: 'workspace-speech-smoke',
  projectId: 'project-speech-smoke',
  mediaAssetId: 'media-speech-smoke',
})
check(captionBlocked.status === 'blocked', 'production-blocked caption mode must refuse render/export.')

await expectRejects(
  () => runSpeechFoundation({
    mode: 'dry_run',
    workspaceId: 'workspace-speech-smoke',
    projectId: 'project-speech-smoke',
    mediaAssetId: 'media-speech-smoke',
    sourceAudioArtifactId: 'audio-artifact-smoke',
    workerPayload: buildPayload('gpu_ai_worker', { rawPrompt: 'do this from chat' }),
  }),
  'Speech runner must reject raw prompt payload fields.',
)

await expectRejects(
  () => runCaptionFoundation({
    mode: 'dry_run',
    workspaceId: 'workspace-speech-smoke',
    projectId: 'project-speech-smoke',
    mediaAssetId: 'media-speech-smoke',
    workerPayload: buildPayload('render_worker', undefined, ['https://storage.googleapis.com/caption?X-Goog-Signature=abc']),
  }),
  'Caption runner must reject signed URL payload fields.',
)

const speechRouted = await runProductionWorkerRuntime({
  payload: buildPayload('gpu_ai_worker', {
    speechFoundation: {
      mode: 'dry_run',
      sourceAudioArtifactId: 'audio-artifact-smoke',
    },
  }, ['workspaces/workspace-speech-smoke/projects/project-speech-smoke/audio/audio.wav'], ['faster_whisper']),
})
check(speechRouted.status === 'completed', 'Explicit speechFoundation route should complete in dry-run.')
check(speechRouted.output?.futureHandler === 'gpu_ai_worker_speech_foundation', 'Speech route must be explicit.')

const captionRouted = await runProductionWorkerRuntime({
  payload: buildPayload('render_worker', {
    captionFoundation: {
      mode: 'dry_run',
      formats: ['srt', 'webvtt', 'ass'],
    },
  }, ['workspaces/workspace-speech-smoke/projects/project-speech-smoke/captions/captions.ass'], ['remotion']),
})
check(captionRouted.status === 'completed', 'Explicit captionFoundation route should complete in dry-run.')
check(captionRouted.output?.futureHandler === 'render_worker_caption_foundation', 'Caption route must be explicit.')

const combined = JSON.stringify({ speechDryRun, captionDryRun, speechRouted, captionRouted }).toLowerCase()
check(!combined.includes('revideo'), 'Speech/caption foundation must not use Revideo.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'transcript_invalid_timestamps_rejected',
    'transcript_normalized',
    'fillers_detected_without_removal',
    'repeated_takes_detected_without_cutting',
    'caption_segments_readable',
    'caption_timing_qa',
    'caption_readability_qa',
    'caption_safe_zone_warnings',
    'srt_webvtt_ass_builders',
    'private_artifacts',
    'speech_dry_run_without_model',
    'caption_dry_run_without_ffmpeg',
    'local_dev_skips',
    'production_blocked',
    'raw_prompt_signed_url_rejected',
    'explicit_worker_routes',
    'no_revideo',
  ],
}))

function buildMockSegments(): TranscriptSegment[] {
  return [
    segment('segment-1', 0, 1.8, ['Um', 'I', 'think', 'this', 'take', 'is', 'ready.']),
    segment('segment-2', 2.1, 3.7, ['This', 'take', 'is', 'ready', 'for', 'review.']),
    segment('segment-3', 4, 5.7, ['This', 'take', 'is', 'ready', 'for', 'review.']),
  ]
}

function segment(segmentId: string, start: number, end: number, words: string[]): TranscriptSegment {
  const duration = end - start
  return {
    segmentId,
    startSeconds: start,
    endSeconds: end,
    text: words.join('  '),
    confidence: 0.9,
    words: words.map((word, index) => ({
      word,
      startSeconds: Number((start + (duration / words.length) * index).toFixed(3)),
      endSeconds: Number((start + (duration / words.length) * (index + 1)).toFixed(3)),
      confidence: 0.9,
      segmentId,
    })),
  }
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata?: Record<string, unknown>,
  storageReferenceIds = ['workspaces/workspace-speech-smoke/projects/project-speech-smoke/source/source.wav'],
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds'] = workerType === 'gpu_ai_worker' ? ['faster_whisper'] : ['remotion'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `prod-speech-caption-${workerType}`,
    workspaceId: 'workspace-speech-smoke',
    projectId: 'project-speech-smoke',
    mediaAssetId: 'media-speech-smoke',
    approvedSnapshotId: 'approved-snapshot-speech-smoke',
    editPlanId: 'edit-plan-speech-smoke',
    toolExecutionPlanId: 'tool-execution-speech-smoke',
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds,
    requestedRecipeIds: workerType === 'gpu_ai_worker' ? ['transcript_recipe'] : ['caption_recipe'],
    storageReferenceIds,
    createdAt: new Date().toISOString(),
    metadata,
  }
  return { ...payload, idempotencyKey: buildWorkerIdempotencyKey(payload) }
}
