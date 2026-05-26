import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'

export function buildTimelineQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  timelineManifest: TimelineManifest
}): QualityGateResult[] {
  const timelineIssues = validateTimeline(input.timelineManifest)
  const transcriptIssues = input.timelineManifest.captionLayers.length > 0
    ? []
    : [issue('caption_or_transcript_layer_missing', 'Timeline has no caption/transcript layer reference yet.', 'warning')]

  return [
    buildGate(input, 'render_timeline_integrity', timelineIssues),
    buildGate(input, 'cut_smoothness', timelineIssues.filter((item) => item.code.includes('clip'))),
    buildGate(input, 'transcript_alignment', transcriptIssues),
  ]
}

function validateTimeline(timelineManifest: TimelineManifest): ProductionToolIssue[] {
  const issues: ProductionToolIssue[] = []
  if (timelineManifest.durationSeconds <= 0) {
    issues.push(issue('timeline_duration_zero', 'Timeline duration must be greater than zero.', 'blocking'))
  }
  for (const clip of timelineManifest.clips) {
    if (clip.sourceRange.startSeconds < 0 || clip.timelineRange.startSeconds < 0) {
      issues.push(issue('clip_negative_timestamp', `${clip.id} has a negative timestamp.`, 'blocking'))
    }
    if (clip.sourceRange.endSeconds <= clip.sourceRange.startSeconds || clip.timelineRange.endSeconds <= clip.timelineRange.startSeconds) {
      issues.push(issue('clip_end_before_start', `${clip.id} has invalid timing.`, 'blocking'))
    }
  }
  return issues
}

function buildGate(
  input: {
    workspaceId: string
    projectId: string
    mediaAssetId: string
    toolExecutionPlanId?: string
  },
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `timeline-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'timeline-foundation-dry-run',
    recipeId: 'smart_cut_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.3 : warning ? 0.76 : 0.97,
    threshold: 0.8,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length
      ? [{ action: 'review_timeline_manifest', reason: `Resolve ${gateType} issues before render.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed deterministic Milestone 8 checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking || warning,
    humanReviewRequired: issues.some((item) => item.code.includes('transcript')),
  }
}

function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
