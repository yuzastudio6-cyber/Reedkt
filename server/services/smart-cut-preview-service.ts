import { readFile, rm } from 'node:fs/promises'
import { ApiError } from '../errors/api-error'
import { probeMediaFile, type MediaProbeSummary } from '../media/ffprobe'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createStorageAdapter, resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import type { ServiceContext } from '../types'
import { runSmartCutTimelineExecutionPipeline } from '../workers/smart-cut-timeline'
import type {
  SmartCutPlan,
  SegmentCandidate,
  SegmentKeepDecision,
  SegmentRemoveDecision,
} from '../workers/smart-cut'
import { createMockId, mockWarning } from './service-helpers'

export interface SmartCutPreviewSourceObject {
  id: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
}

export interface SmartCutPreviewRequest {
  workspaceId: string
  projectId: string
  renderJobId: string
  sourceStorageObjectId: string
  sourceStorageObject?: SmartCutPreviewSourceObject
  approvedPlanSnapshotId: string
  creditReservationId: string
  toolExecutionPlanId?: string
  workerInstanceId?: string
  sourceVideoDurationSeconds?: number
  sourceVideoWidth?: number
  sourceVideoHeight?: number
  strict?: boolean
}

export interface SmartCutPreviewSmokeResponse {
  ok: true
  status: 'preview_ready'
  renderJobId: string
  sourceStorageObjectId: string
  sourceMediaAssetId: string
  previewStorageObjectId: string
  outputBucketName: string
  outputObjectPath: string
  durationSeconds?: number
  sizeBytes: number
  checksumSha256: string
  sourceProbe: MediaProbeSummary
  previewProbe: MediaProbeSummary
  plannedTargetDurationSeconds?: number
  keepSegmentCount: number
  removeSegmentCount: number
  qaGateStatuses: Array<{
    gateType: string
    status: string
    blocksPreview: boolean
    blocksFinalExport: boolean
  }>
  finalDeliveryBlocked: true
  productReady: false
  warnings: string[]
}

export async function runSmartCutPreviewSmoke(
  context: ServiceContext,
  input: SmartCutPreviewRequest,
): Promise<SmartCutPreviewSmokeResponse> {
  if (context.env.storageMode !== 'local') {
    throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Smart-cut preview smoke requires STORAGE_MODE=local.', 409)
  }
  if (!input.approvedPlanSnapshotId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Smart-cut preview smoke requires an approved snapshot ID.', 409)
  }
  if (!input.creditReservationId) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Smart-cut preview smoke requires a credit reservation ID.', 409)
  }

  const sourceObject = input.sourceStorageObject
  if (!sourceObject) {
    throw new ApiError('SOURCE_MEDIA_NOT_READY', 'Smart-cut preview smoke requires source storage object metadata.', 400)
  }
  const sourceMediaAssetId = sourceObject.mediaAssetId ?? input.sourceStorageObjectId
  const sourcePath = resolveLocalStorageObjectPath(
    context.env.localStorageRoot,
    sourceObject.bucketName,
    sourceObject.objectPath,
  )
  const sourceProbe = await probeMediaFile(sourcePath, {
    ffprobeBin: context.env.ffprobeBin,
    timeoutMs: context.env.toolCheckTimeoutMs,
  })
  const sourceDurationSeconds = sourceProbe.durationSeconds ?? input.sourceVideoDurationSeconds
  if (!sourceDurationSeconds || sourceDurationSeconds <= 0) {
    throw new ApiError('SOURCE_MEDIA_NOT_READY', 'Smart-cut preview smoke requires source duration evidence.', 409)
  }

  const workerTempBucketName = resolveBucketName(context.env, 'worker_temp')
  const outputRoot = resolveLocalStorageObjectPath(
    context.env.localStorageRoot,
    workerTempBucketName,
    buildCanonicalObjectPath({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      purpose: 'worker_temp',
      ownerId: input.renderJobId,
      fileName: 'smart-cut-preview-workdir',
    }),
  )
  await rm(outputRoot, { recursive: true, force: true })

  try {
    const smartCutPlan = buildTechnicalSmartCutPreviewPlan({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: sourceMediaAssetId,
      sourceDurationSeconds,
    })
    const execution = await runSmartCutTimelineExecutionPipeline({
      mode: 'local_dev',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: sourceMediaAssetId,
      approvedSnapshotId: input.approvedPlanSnapshotId,
      toolExecutionPlanId: input.toolExecutionPlanId ?? `tool-execution-${input.renderJobId}-smart-cut-preview`,
      idempotencyKey: `smart-cut-preview:${input.renderJobId}`,
      editPlanId: input.approvedPlanSnapshotId,
      smartCutPlan,
      sourceVideoArtifactId: input.sourceStorageObjectId,
      sourceVideoLocalPath: sourcePath,
      sourceStorageObjectPath: sourceObject.objectPath,
      outputDirectory: outputRoot,
      enableProxyPreview: true,
      allowFinalExport: false,
      ffmpegBin: context.env.ffmpegBin,
      ffprobeBin: context.env.ffprobeBin,
      timeoutMs: 120_000,
      fps: 30,
      canvas: {
        width: sourceProbe.width ?? input.sourceVideoWidth ?? 1080,
        height: sourceProbe.height ?? input.sourceVideoHeight ?? 1920,
      },
      mediaDurationSeconds: sourceDurationSeconds,
    })

    if (execution.status !== 'partial' || !execution.ffmpegCommandPlan?.expectedPreviewOutputPath) {
      throw new ApiError('RENDER_NOT_READY', 'Private review preview did not complete.', input.strict ? 409 : 202, {
        status: execution.status,
        skippedReasons: execution.skippedReasons,
        warnings: execution.warnings,
        qaResults: execution.qaResults.map((gate) => ({
          gateType: gate.gateType,
          status: gate.status,
          blocking: gate.blocking,
          issues: gate.issues,
        })),
      })
    }

    const previewBytes = await readFile(execution.ffmpegCommandPlan.expectedPreviewOutputPath)
    const previewBucketName = resolveBucketName(context.env, 'preview')
    const outputObjectPath = buildCanonicalObjectPath({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      purpose: 'preview',
      ownerId: input.renderJobId,
      fileName: 'private-review-preview.mp4',
    })
    const storage = createStorageAdapter(context.env)
    const previewMetadata = await storage.putObject({
      bucketName: previewBucketName,
      objectPath: outputObjectPath,
      body: previewBytes,
      mimeType: 'video/mp4',
    })
    const previewPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, previewBucketName, outputObjectPath)
    const previewProbe = await probeMediaFile(previewPath, {
      ffprobeBin: context.env.ffprobeBin,
      timeoutMs: context.env.toolCheckTimeoutMs,
    })
    const finalDeliveryBlocked = execution.qaResults.some((gate) => gate.gateType === 'final_delivery' && gate.status !== 'passed')
    if (!finalDeliveryBlocked) {
      throw new ApiError('QA_BLOCKED_PREVIEW', 'Smart-cut preview smoke must keep final delivery blocked.', 409)
    }

    return {
      ok: true,
      status: 'preview_ready',
      renderJobId: input.renderJobId,
      sourceStorageObjectId: input.sourceStorageObjectId,
      sourceMediaAssetId,
      previewStorageObjectId: createMockId('storage_object'),
      outputBucketName: previewBucketName,
      outputObjectPath,
      durationSeconds: previewProbe.durationSeconds,
      sizeBytes: previewMetadata.sizeBytes,
      checksumSha256: previewMetadata.checksumSha256,
      sourceProbe,
      previewProbe,
      plannedTargetDurationSeconds: smartCutPlan.targetDurationSeconds,
      keepSegmentCount: smartCutPlan.keepSegments.length,
      removeSegmentCount: smartCutPlan.removeSegments.length,
      qaGateStatuses: execution.qaResults.map((gate) => ({
        gateType: gate.gateType,
        status: gate.status,
        blocksPreview: gate.blocksPreview,
        blocksFinalExport: gate.blocksFinalExport,
      })),
      finalDeliveryBlocked: true,
      productReady: false,
      warnings: [
        mockWarning('Smart-cut private review preview smoke'),
        'Private review preview created from backend-local source media only.',
        'Final delivery remains blocked; this is not a public export or production-ready edit.',
        ...execution.warnings,
      ],
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true })
  }
}

export function buildTechnicalSmartCutPreviewPlan(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceDurationSeconds: number
}): SmartCutPlan {
  const sourceDurationSeconds = round(input.sourceDurationSeconds)
  const keepRanges = buildKeepRanges(sourceDurationSeconds)
  const keepSegments = keepRanges.map((range, index): SegmentKeepDecision => ({
    decisionId: `keep-real-video-technical-sample-${index + 1}`,
    candidateId: `candidate-real-video-technical-sample-${index + 1}`,
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    score: index === 0 ? 0.92 : 0.84,
    confidence: 0.72,
    reason: index === 0
      ? 'Private technical preview keeps the opening range as protected setup evidence.'
      : 'Private technical preview keeps a bounded source range to verify trim/concat execution; content acceptance is deferred to source-understanding QA.',
    protected: index === 0,
  }))
  const removeSegments = buildRemoveSegments(keepRanges, sourceDurationSeconds)
  const candidates = keepRanges.map((range, index): SegmentCandidate => ({
    candidateId: `candidate-real-video-technical-sample-${index + 1}`,
    candidateType: 'fallback',
    source: 'fallback',
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    text: 'Technical private preview range.',
    transcriptSegmentIds: [],
    captionIds: [],
    wordCount: 0,
    evidence: {
      hasTranscript: false,
      hasWordTimestamps: false,
      hasSilence: false,
      hasSceneBoundary: false,
      hasCaption: false,
      fillerLabels: [],
      repeatedTakeCandidateIds: [],
    },
    risks: ['none'],
    protected: index === 0,
    reason: 'Fallback range is used only to verify backend-local smart-cut preview execution against the uploaded private source.',
  }))
  const targetDurationSeconds = round(keepSegments.reduce((sum, segment) => sum + (segment.endSeconds - segment.startSeconds), 0))

  return {
    id: `smart-cut-plan-${input.mediaAssetId}-real-video-preview`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceDurationSeconds,
    targetDurationSeconds,
    intent: ['tighten_pacing', 'preserve_story'],
    aggressiveness: 'gentle',
    pacingProfile: {
      profileId: 'natural_clean',
      maxSilenceSeconds: 1.2,
      minSegmentDurationSeconds: 3,
      targetCutsPerMinuteMin: 2,
      targetCutsPerMinuteMax: 5,
      emotionalPausePolicy: 'protect',
      notes: [
        'Private technical preview only.',
        'Content-level trim acceptance is deferred until source-understanding and transcript evidence are available.',
      ],
    },
    segmentCandidates: candidates,
    segmentScores: [],
    keepSegments,
    removeSegments,
    cutBoundaries: removeSegments.flatMap((segment) => [
      {
        boundaryId: `boundary-${segment.decisionId}-start`,
        sourceTimeSeconds: segment.startSeconds,
        adjustedTimeSeconds: segment.startSeconds,
        paddingBeforeSeconds: 0,
        paddingAfterSeconds: 0,
        risks: ['none' as const],
        safe: true,
        reason: 'Technical private preview boundary; source-content meaning QA deferred.',
      },
      {
        boundaryId: `boundary-${segment.decisionId}-end`,
        sourceTimeSeconds: segment.endSeconds,
        adjustedTimeSeconds: segment.endSeconds,
        paddingBeforeSeconds: 0,
        paddingAfterSeconds: 0,
        risks: ['none' as const],
        safe: true,
        reason: 'Technical private preview boundary; source-content meaning QA deferred.',
      },
    ]),
    protectedSegments: keepSegments.filter((segment) => segment.protected),
    rejectedCandidates: [],
    meaningFindings: [{
      findingId: 'real-video-meaning-qa-deferred',
      severity: 'info',
      range: { startSeconds: 0, endSeconds: sourceDurationSeconds },
      code: 'source_understanding_required_before_final_edit_acceptance',
      message: 'This private preview verifies execution mechanics only; final professional trim acceptance requires source-understanding evidence.',
    }],
    warnings: ['Private smart-cut preview is not accepted as a final professional edit or public export.'],
    confidence: 0.72,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function buildKeepRanges(sourceDurationSeconds: number): Array<{ startSeconds: number; endSeconds: number }> {
  const firstEnd = Math.min(4, sourceDurationSeconds)
  if (sourceDurationSeconds <= 12) {
    return [{ startSeconds: 0, endSeconds: round(sourceDurationSeconds) }]
  }

  const middleStart = clamp(sourceDurationSeconds * 0.45, firstEnd + 2, sourceDurationSeconds - 8)
  const middleEnd = Math.min(middleStart + 4, sourceDurationSeconds - 4)
  const finalStart = Math.max(sourceDurationSeconds - 4, middleEnd + 0.5)
  return [
    { startSeconds: 0, endSeconds: firstEnd },
    { startSeconds: middleStart, endSeconds: middleEnd },
    { startSeconds: finalStart, endSeconds: sourceDurationSeconds },
  ]
    .map((range) => ({ startSeconds: round(range.startSeconds), endSeconds: round(range.endSeconds) }))
    .filter((range) => range.endSeconds - range.startSeconds >= 1)
}

function buildRemoveSegments(
  keepRanges: Array<{ startSeconds: number; endSeconds: number }>,
  sourceDurationSeconds: number,
): SegmentRemoveDecision[] {
  const sorted = [...keepRanges].sort((a, b) => a.startSeconds - b.startSeconds)
  const removals: SegmentRemoveDecision[] = []
  let cursor = 0
  for (const [index, range] of sorted.entries()) {
    if (range.startSeconds - cursor >= 0.5) {
      removals.push({
        decisionId: `remove-real-video-technical-gap-${index + 1}`,
        candidateId: `candidate-real-video-technical-gap-${index + 1}`,
        startSeconds: round(cursor),
        endSeconds: round(range.startSeconds),
        score: 0.7,
        confidence: 0.7,
        reason: 'Private technical preview gap for verifying trim/concat execution; not accepted as content-level cut approval.',
        risks: ['none'],
        futureOnly: true,
      })
    }
    cursor = Math.max(cursor, range.endSeconds)
  }
  if (sourceDurationSeconds - cursor >= 0.5) {
    removals.push({
      decisionId: `remove-real-video-technical-gap-${sorted.length + 1}`,
      candidateId: `candidate-real-video-technical-gap-${sorted.length + 1}`,
      startSeconds: round(cursor),
      endSeconds: round(sourceDurationSeconds),
      score: 0.7,
      confidence: 0.7,
      reason: 'Private technical preview tail gap for verifying trim/concat execution; not accepted as content-level cut approval.',
      risks: ['none'],
      futureOnly: true,
    })
  }
  return removals
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
