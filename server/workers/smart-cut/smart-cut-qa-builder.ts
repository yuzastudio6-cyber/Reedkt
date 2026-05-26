import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { SmartCutPlan, SmartCutQAResult } from './smart-cut-worker-types'

export function buildSmartCutQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  plan: SmartCutPlan
}): SmartCutQAResult {
  const issues = [
    ...validateRanges(input.plan),
    ...validateProtectedSegments(input.plan),
    ...validateRepeatedTakeSafety(input.plan),
  ]
  const transcriptIssues = input.plan.segmentCandidates.some((candidate) => candidate.evidence.hasTranscript)
    ? []
    : [issue('transcript_missing', 'Transcript evidence is missing; smart cut remains conservative.', 'warning')]
  const renderIssues = input.plan.keepSegments.length === 0
    ? [issue('timeline_duration_zero', 'Timeline would have zero kept segments.', 'blocking')]
    : []

  return {
    issues: [...issues, ...transcriptIssues, ...renderIssues].map((item) => item.message),
    qualityGateResults: [
      buildGate(input, 'cut_smoothness', issues),
      buildGate(input, 'transcript_alignment', transcriptIssues),
      buildGate(input, 'audio_sync', input.plan.cutBoundaries.some((boundary) => boundary.risks.includes('audio_pop_risk'))
        ? [issue('audio_pop_risk', 'One or more cut boundaries need future audio pop/crossfade handling.', 'warning')]
        : []),
      buildGate(input, 'render_timeline_integrity', renderIssues),
    ],
  }
}

function validateRanges(plan: SmartCutPlan): ProductionToolIssue[] {
  const ranges = [...plan.keepSegments, ...plan.removeSegments]
  const issues: ProductionToolIssue[] = []
  for (const range of ranges) {
    if (range.startSeconds < 0) issues.push(issue('negative_timestamp', `${range.decisionId} has a negative timestamp.`, 'blocking'))
    if (range.endSeconds <= range.startSeconds) issues.push(issue('end_before_start', `${range.decisionId} ends before it starts.`, 'blocking'))
    if (range.endSeconds > plan.sourceDurationSeconds + 0.01) issues.push(issue('source_bounds_exceeded', `${range.decisionId} exceeds source duration.`, 'blocking'))
  }
  for (const remove of plan.removeSegments) {
    if (plan.keepSegments.some((keep) => overlaps(remove, keep))) {
      issues.push(issue('overlapping_keep_remove', `${remove.decisionId} overlaps a keep segment and needs review.`, 'blocking'))
    }
  }
  if (plan.cutBoundaries.some((boundary) => boundary.risks.includes('mid_word'))) {
    issues.push(issue('mid_word_cut', 'Cut boundary intersects word timing and must be shifted before execution.', 'blocking'))
  }
  return issues
}

function validateProtectedSegments(plan: SmartCutPlan): ProductionToolIssue[] {
  return plan.protectedSegments.flatMap((protectedSegment) => plan.removeSegments.some((remove) => overlaps(protectedSegment, remove))
    ? [issue('protected_segment_removed', `${protectedSegment.decisionId} is protected but overlaps a removal.`, 'blocking')]
    : [])
}

function validateRepeatedTakeSafety(plan: SmartCutPlan): ProductionToolIssue[] {
  const repeatCandidateIds = new Set(plan.segmentCandidates.flatMap((candidate) => candidate.evidence.repeatedTakeCandidateIds))
  const issues: ProductionToolIssue[] = []
  for (const repeatId of repeatCandidateIds) {
    const hasProtectedKeeper = plan.protectedSegments.some((segment) => segment.candidateId === repeatId)
    if (!hasProtectedKeeper) {
      issues.push(issue('repeated_take_no_keeper', `${repeatId} has no protected keeper segment.`, 'blocking'))
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
    plan: SmartCutPlan
  },
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `smart-cut-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'smart-cut-foundation-dry-run',
    recipeId: gateType === 'render_timeline_integrity' ? 'final_export_recipe' : 'smart_cut_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.78 : 0.96,
    threshold: 0.8,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_smart_cut_plan', reason: `Resolve ${gateType} issues before real cutting/rendering.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed deterministic Milestone 8 checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking || warning,
    humanReviewRequired: issues.some((item) => item.code.includes('meaning') || item.code.includes('protected')),
  }
}

function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}

function overlaps(a: { startSeconds: number; endSeconds: number }, b: { startSeconds: number; endSeconds: number }): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds
}
