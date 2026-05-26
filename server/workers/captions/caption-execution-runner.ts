import path from 'node:path'
import type { TranscriptSegment, TranscriptWord } from '../speech'
import { buildCaptionSegmentsFromTranscript, buildCaptionSegmentsFromWords } from './caption-segment-builder'
import { buildCaptionFile } from './caption-file-builder'
import { chooseCaptionPlacement } from './caption-safe-zone-policy'
import { scoreCaptionReadability } from './caption-readability-policy'
import { scoreCaptionTiming } from './caption-timing-policy'
import { buildCaptionQualityGateResult, scoreFromIssues } from './caption-qa-result-builder'
import { validateCaptionExecutionPolicy } from './caption-execution-policy'
import {
  buildCaptionExecutionFileArtifact,
  buildCaptionExecutionQaArtifact,
  buildCaptionExecutionSegmentsArtifact,
} from './caption-execution-artifact-writer'
import { runCaptionPreviewExecution } from './caption-preview-command-runner'
import { buildCaptionPreviewArtifact } from './caption-preview-artifact-writer'
import type { CaptionExecutionInput, CaptionExecutionResult } from '../speech-caption/speech-caption-pipeline-types'
import type { CaptionFileFormat } from './caption-worker-types'

export async function runCaptionExecution(input: CaptionExecutionInput): Promise<CaptionExecutionResult> {
  const policy = validateCaptionExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      captionSegments: [],
      captionFiles: [],
      artifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons.map((reason) => ({
        code: 'caption_execution_policy_blocked',
        message: reason,
        tool: 'ffmpeg',
      })),
      warnings: policy.warnings,
    }
  }

  const transcriptSegments = input.transcriptSegments ??
    input.transcript?.segments ??
    mockCaptionExecutionSegments()
  const words = normalizeWordsInput(input.wordTimestamps, transcriptSegments)
  const placement = chooseCaptionPlacement({
    requestedPlacement: undefined,
    mediaAnalysisReport: undefined,
  })
  const captionSegments = words.length > 0
    ? buildCaptionSegmentsFromWords(words, {
      presetId: input.captionStyle,
      placement: placement.placement,
    })
    : buildCaptionSegmentsFromTranscript(transcriptSegments, {
      presetId: input.captionStyle,
      placement: placement.placement,
    })
  const formats = selectedFormats(input)
  const fileMode = input.mode === 'local_dev' ? 'local_dev' : 'dry_run'
  const captionFiles = await Promise.all(formats.map((format) => buildCaptionFile({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    format,
    captions: captionSegments,
    stylePresetId: input.captionStyle,
    mode: fileMode,
    outputRoot: input.outputDirectory,
  })))
  const readability = scoreCaptionReadability(captionSegments)
  const timing = scoreCaptionTiming(captionSegments)
  const safeZone = scoreFromIssues(placement.issues, 0.75)
  const alignment = scoreFromIssues(
    captionSegments.flatMap((caption) => caption.words.length === 0
      ? [{ code: 'caption_missing_words', message: `${caption.captionId} has no word timestamp references.`, severity: 'warning' as const }]
      : []),
    0.8,
  )
  const qaResults = [
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'speech-caption-execution-dry-run',
      gateType: 'transcript_alignment',
      score: alignment,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'speech-caption-execution-dry-run',
      gateType: 'caption_timing',
      score: timing,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'speech-caption-execution-dry-run',
      gateType: 'caption_readability',
      score: readability,
    }),
    buildCaptionQualityGateResult({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? 'speech-caption-execution-dry-run',
      gateType: 'caption_safe_zone',
      score: safeZone,
    }),
  ]
  const artifacts = [
    buildCaptionExecutionSegmentsArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      captionSegments,
    }),
    ...captionFiles.map((captionFile) => buildCaptionExecutionFileArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      captionFile,
    })),
    buildCaptionExecutionQaArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      qaResults,
    }),
  ]
  const skippedReasons = []

  if (input.mode === 'local_dev' && input.buildPreview) {
    const assFile = captionFiles.find((captionFile) => captionFile.format === 'ass')
    const preview = await runCaptionPreviewExecution({
      enabled: input.enableCaptionPreview === true,
      ffmpegBin: input.ffmpegBin,
      sourceVideoLocalPath: input.sourceVideoLocalPath,
      assCaptionLocalPath: assFile?.localFilePath,
      outputPreviewPath: input.outputDirectory ? path.join(input.outputDirectory, 'caption-preview.mp4') : undefined,
      safeOutputRoot: input.outputDirectory,
      timeoutMs: input.timeoutMs,
    })
    if (preview.status === 'created') {
      artifacts.push(buildCaptionPreviewArtifact({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        mediaAssetId: input.mediaAssetId,
        localFilePath: preview.outputPreviewPath,
      }))
    }
    if (preview.skipReason) skippedReasons.push(preview.skipReason)
  }

  return {
    mode: input.mode,
    status: input.mode === 'dry_run' ? 'dry_run' : skippedReasons.length > 0 ? 'partial' : 'completed',
    captionSegments,
    captionFiles,
    artifacts,
    qaResults,
    skippedReasons,
    warnings: [
      ...policy.warnings,
      ...placement.issues.map((issue) => issue.message),
      'M13 caption execution does not perform final export or evaluation-only renderer work.',
    ],
  }
}

function selectedFormats(input: CaptionExecutionInput): CaptionFileFormat[] {
  const formats: CaptionFileFormat[] = []
  if (input.buildSrt !== false) formats.push('srt')
  if (input.buildWebVtt !== false) formats.push('webvtt')
  if (input.buildAss !== false) formats.push('ass')
  return formats
}

function normalizeWordsInput(
  wordInput: CaptionExecutionInput['wordTimestamps'],
  segments: TranscriptSegment[],
): TranscriptWord[] {
  if (Array.isArray(wordInput)) return wordInput
  if (wordInput?.words.length) return wordInput.words
  return segments.flatMap((segment) => segment.words)
}

function mockCaptionExecutionSegments(): TranscriptSegment[] {
  return [{
    segmentId: 'caption-exec-mock-1',
    startSeconds: 0,
    endSeconds: 2.4,
    text: 'Captions are generated deterministically from word timestamps.',
    confidence: 0.9,
    words: [
      { word: 'Captions', startSeconds: 0, endSeconds: 0.42, segmentId: 'caption-exec-mock-1' },
      { word: 'are', startSeconds: 0.42, endSeconds: 0.65, segmentId: 'caption-exec-mock-1' },
      { word: 'generated', startSeconds: 0.65, endSeconds: 1.15, segmentId: 'caption-exec-mock-1' },
      { word: 'deterministically', startSeconds: 1.15, endSeconds: 1.75, segmentId: 'caption-exec-mock-1' },
      { word: 'from', startSeconds: 1.75, endSeconds: 1.95, segmentId: 'caption-exec-mock-1' },
      { word: 'word', startSeconds: 1.95, endSeconds: 2.12, segmentId: 'caption-exec-mock-1' },
      { word: 'timestamps.', startSeconds: 2.12, endSeconds: 2.4, segmentId: 'caption-exec-mock-1' },
    ],
  }]
}
