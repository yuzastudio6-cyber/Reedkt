import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import type { TranscriptSegment } from '../speech'
import { buildCaptionSegmentsFromTranscript, buildCaptionSegmentsFromWords } from './caption-segment-builder'
import { buildCaptionFile } from './caption-file-builder'
import { chooseCaptionPlacement } from './caption-safe-zone-policy'
import { scoreCaptionReadability } from './caption-readability-policy'
import { scoreCaptionTiming } from './caption-timing-policy'
import { buildCaptionQualityGateResult, scoreFromIssues } from './caption-qa-result-builder'
import { runLibassCaptionPreview } from './libass-caption-preview-adapter'
import type {
  CaptionFoundationResult,
  CaptionFoundationRunnerInput,
  CaptionFoundationSkipReason,
  CaptionSegment,
} from './caption-worker-types'

export async function runCaptionFoundation(input: CaptionFoundationRunnerInput): Promise<CaptionFoundationResult> {
  validateCaptionFoundationInput(input)

  if (input.mode === 'production_blocked') {
    return {
      mode: input.mode,
      status: 'blocked',
      captionSegments: [],
      captionFiles: [],
      artifacts: [],
      qualityGateResults: [],
      skipReasons: [{
        code: 'production_caption_render_blocked',
        message: 'Milestone 7 blocks production caption render/export until future render milestones.',
        tool: 'ffmpeg',
      }],
      warnings: ['No caption preview or final export was executed.'],
    }
  }

  const transcriptSegments = input.transcriptSegments ?? mockTranscriptSegments()
  const placement = chooseCaptionPlacement({
    requestedPlacement: undefined,
    mediaAnalysisReport: undefined,
  })
  const captions = input.wordTimestamps?.length
    ? buildCaptionSegmentsFromWords(input.wordTimestamps, { presetId: input.stylePresetId, placement: placement.placement })
    : buildCaptionSegmentsFromTranscript(transcriptSegments, { presetId: input.stylePresetId, placement: placement.placement })
  const formats = input.formats ?? ['srt', 'webvtt', 'ass']
  const captionFiles = await Promise.all(formats.map((format) => buildCaptionFile({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    format,
    captions,
    stylePresetId: input.stylePresetId,
    mode: input.mode === 'local_dev' ? 'local_dev' : 'dry_run',
    outputRoot: input.outputRoot,
  })))
  const readability = scoreCaptionReadability(captions)
  const timing = scoreCaptionTiming(captions)
  const safeZoneScore = scoreFromIssues(placement.issues, 0.75)
  const alignmentScore = scoreTranscriptAlignment(captions)
  const qualityGateResults = [
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'caption-foundation-dry-run',
      gateType: 'caption_readability',
      score: readability,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'caption-foundation-dry-run',
      gateType: 'caption_timing',
      score: timing,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'caption-foundation-dry-run',
      gateType: 'caption_safe_zone',
      score: safeZoneScore,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'caption-foundation-dry-run',
      gateType: 'transcript_alignment',
      score: alignmentScore,
    }),
  ]
  const artifacts = captionFiles.flatMap((file) => file.artifact ? [file.artifact] : [])
  const skipReasons: CaptionFoundationSkipReason[] = []

  if (input.mode === 'local_dev') {
    const assFile = captionFiles.find((file) => file.format === 'ass')
    const preview = await runLibassCaptionPreview({
      ffmpegBin: input.ffmpegBin ?? 'ffmpeg',
      sourceVideoLocalPath: input.sourceVideoLocalPath,
      assCaptionLocalPath: assFile?.localFilePath,
      outputPreviewPath: input.outputRoot ? `${input.outputRoot}/caption-preview.mp4` : undefined,
      safeOutputRoot: input.outputRoot,
      timeoutMs: input.timeoutMs ?? 20_000,
    })
    if (preview.skipReason) skipReasons.push(preview.skipReason)
  }

  return {
    mode: input.mode,
    status: input.mode === 'dry_run' ? 'dry_run' : 'partial',
    captionSegments: captions,
    captionFiles,
    artifacts,
    qualityGateResults,
    skipReasons,
    warnings: [
      ...placement.issues.map((issue) => issue.message),
      'Milestone 7 caption foundation does not perform final export or evaluation-only renderer work.',
    ],
  }
}

function validateCaptionFoundationInput(input: CaptionFoundationRunnerInput): void {
  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }
}

function scoreTranscriptAlignment(captions: CaptionSegment[]) {
  const issues = captions.flatMap((caption) => caption.words.length === 0
    ? [{ code: 'caption_missing_word_timestamps', message: `${caption.captionId} has no word timestamp references.`, severity: 'warning' as const }]
    : [])
  return scoreFromIssues(issues, 0.8)
}

function mockTranscriptSegments(): TranscriptSegment[] {
  return [{
    segmentId: 'caption-mock-segment-1',
    startSeconds: 0,
    endSeconds: 2.4,
    text: 'Captions should stay readable and aligned to speech.',
    confidence: 0.9,
    words: [
      { word: 'Captions', startSeconds: 0, endSeconds: 0.4, segmentId: 'caption-mock-segment-1' },
      { word: 'should', startSeconds: 0.4, endSeconds: 0.7, segmentId: 'caption-mock-segment-1' },
      { word: 'stay', startSeconds: 0.7, endSeconds: 1, segmentId: 'caption-mock-segment-1' },
      { word: 'readable', startSeconds: 1, endSeconds: 1.45, segmentId: 'caption-mock-segment-1' },
      { word: 'and', startSeconds: 1.45, endSeconds: 1.65, segmentId: 'caption-mock-segment-1' },
      { word: 'aligned', startSeconds: 1.65, endSeconds: 2.05, segmentId: 'caption-mock-segment-1' },
      { word: 'to', startSeconds: 2.05, endSeconds: 2.2, segmentId: 'caption-mock-segment-1' },
      { word: 'speech.', startSeconds: 2.2, endSeconds: 2.4, segmentId: 'caption-mock-segment-1' },
    ],
  }]
}
