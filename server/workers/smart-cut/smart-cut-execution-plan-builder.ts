import type { ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { SmartCutOperation, SmartCutExecutionPlan, SmartCutTimelineExecutionInput } from './smart-cut-execution-types'
import type { SmartCutPlan, SegmentKeepDecision } from './smart-cut-worker-types'

export function buildSmartCutExecutionPlan(input: {
  smartCutPlan: SmartCutPlan
  executionInput: SmartCutTimelineExecutionInput
}): SmartCutExecutionPlan {
  const keepSegments = [...input.smartCutPlan.keepSegments].sort((a, b) => a.startSeconds - b.startSeconds)
  const cutOperations = buildCutOperations({
    keepSegments,
    smartCutPlan: input.smartCutPlan,
    sourceArtifactId: input.executionInput.proxyVideoArtifactId ?? input.executionInput.sourceVideoArtifactId,
  })
  const targetDurationSeconds = round(keepSegments.reduce((sum, segment) => sum + duration(segment), 0))
  const previewAllowed = input.executionInput.mode === 'local_dev' && input.executionInput.enableProxyPreview === true
  const expectedArtifacts: ToolArtifactType[] = [
    'timeline_manifest',
    'opentimelineio_manifest',
    'qa_report',
    ...(previewAllowed ? ['preview_video' as const] : []),
  ]

  return {
    executionPlanId: `smart-cut-execution-${input.smartCutPlan.mediaAssetId}`,
    sourceDurationSeconds: input.smartCutPlan.sourceDurationSeconds,
    targetDurationSeconds,
    keepSegments,
    removeSegments: input.smartCutPlan.removeSegments,
    cutOperations,
    ffmpegOperationPlan: {
      strategy: 'trim_then_concat_proxy',
      previewOnly: true,
      finalExportAllowed: false,
      operations: ['trim_segment', 'concatenate_segments', 'preview_only'],
      expectedTempFileCount: keepSegments.length,
      expectedOutputArtifactTypes: expectedArtifacts,
      notes: [
        'Milestone 14 builds FFmpeg trim/concat command plans only.',
        'Local-dev preview may execute on proxy/generated temp media when explicitly enabled.',
        'Final export remains blocked.',
      ],
    },
    expectedArtifacts,
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity', 'export_duration_sync'],
    previewAllowed,
    finalExportAllowed: false,
    reasons: [
      ...keepSegments.map((segment) => `Keep ${segment.decisionId}: ${segment.reason}`),
      ...input.smartCutPlan.removeSegments.map((segment) => `Remove ${segment.decisionId}: ${segment.reason}`),
    ],
    warnings: [
      ...input.smartCutPlan.warnings,
      ...(!previewAllowed ? ['Proxy preview is disabled or not in local_dev mode.'] : []),
    ],
  }
}

function buildCutOperations(input: {
  keepSegments: SegmentKeepDecision[]
  smartCutPlan: SmartCutPlan
  sourceArtifactId?: string
}): SmartCutOperation[] {
  let timelineCursor = 0
  const operations: SmartCutOperation[] = []

  for (const [index, segment] of input.keepSegments.entries()) {
    const segmentDuration = duration(segment)
    const timelineStart = timelineCursor
    const timelineEnd = timelineStart + segmentDuration
    const riskFlags = input.smartCutPlan.cutBoundaries
      .filter((boundary) => boundary.sourceTimeSeconds === segment.startSeconds || boundary.sourceTimeSeconds === segment.endSeconds)
      .flatMap((boundary) => boundary.risks)

    operations.push({
      operationId: `keep-${index + 1}`,
      operationType: 'keep_segment',
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      sourceStartSeconds: segment.startSeconds,
      sourceEndSeconds: segment.endSeconds,
      timelineStartSeconds: round(timelineStart),
      durationSeconds: round(segmentDuration),
      sourceArtifactId: input.sourceArtifactId,
      reason: segment.reason,
      riskFlags: riskFlags.length > 0 ? [...new Set(riskFlags)] : ['none'],
      qaStatus: riskFlags.some((risk) => risk !== 'none') ? 'warning' : 'pending',
    })
    operations.push({
      operationId: `trim-${index + 1}`,
      operationType: 'trim_segment',
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      sourceStartSeconds: segment.startSeconds,
      sourceEndSeconds: segment.endSeconds,
      timelineStartSeconds: round(timelineStart),
      durationSeconds: round(segmentDuration),
      sourceArtifactId: input.sourceArtifactId,
      reason: `Trim source to kept segment ${segment.decisionId}.`,
      riskFlags: riskFlags.length > 0 ? [...new Set(riskFlags)] : ['none'],
      qaStatus: riskFlags.some((risk) => risk !== 'none') ? 'warning' : 'pending',
    })
    timelineCursor = timelineEnd
  }

  operations.push({
    operationId: 'concat-kept-segments',
    operationType: 'concatenate_segments',
    startSeconds: 0,
    endSeconds: round(timelineCursor),
    sourceStartSeconds: 0,
    sourceEndSeconds: input.smartCutPlan.sourceDurationSeconds,
    timelineStartSeconds: 0,
    durationSeconds: round(timelineCursor),
    sourceArtifactId: input.sourceArtifactId,
    reason: 'Concatenate kept proxy segments into a preview-only timeline.',
    riskFlags: ['none'],
    qaStatus: 'pending',
  })

  return operations
}

function duration(range: { startSeconds: number; endSeconds: number }): number {
  return Math.max(0, range.endSeconds - range.startSeconds)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
