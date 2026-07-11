import type {
  CleanupPlan,
  CleanupPlanItem,
  RetakeGroup,
  SilenceRegion,
  SourceQualityFlag,
  SourceUnderstandingMap,
  TranscriptSegment,
  WorkflowID,
  WorkflowTimeRange,
} from '../../types'
import {
  MOCK_CREATED_AT,
  getMockInputScenario,
  getPrimaryMockSourceMedia,
  type MockFootagePrepInput,
} from './mock-footage-prep-data'

type BuildMockCleanupPlanInput = MockFootagePrepInput & {
  footagePrepSessionId: WorkflowID
  sourceUnderstandingMap: SourceUnderstandingMap
  transcriptSegments: TranscriptSegment[]
  silenceRegions: SilenceRegion[]
  retakeGroups: RetakeGroup[]
  sourceQualityFlags: SourceQualityFlag[]
}

function cleanupItem(params: {
  id: WorkflowID
  input: MockFootagePrepInput
  cleanupPlanId: WorkflowID
  mediaAssetId: WorkflowID
  sourceRange: WorkflowTimeRange
  action: CleanupPlanItem['action']
  reason: CleanupPlanItem['reason']
  label?: string
  explanation: string
  confidence?: number
}): CleanupPlanItem {
  return {
    id: params.id,
    projectId: params.input.projectId,
    workspaceId: params.input.workspaceId,
    userId: params.input.userId,
    cleanupPlanId: params.cleanupPlanId,
    mediaAssetId: params.mediaAssetId,
    sourceRange: params.sourceRange,
    action: params.action,
    reason: params.reason,
    label: params.label,
    explanation: params.explanation,
    confidence: params.confidence ?? 0.88,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

function originalDuration(input: MockFootagePrepInput) {
  return getPrimaryMockSourceMedia(input).durationMs
}

function cleanDuration(input: MockFootagePrepInput) {
  const scenario = getMockInputScenario(input)
  if (scenario === 'messy_talking_head') return 248000
  if (scenario === 'screen_recording') return 178000
  return 156000
}

export function buildMockCleanupPlan(input: BuildMockCleanupPlanInput): {
  cleanupPlan: CleanupPlan
  cleanupPlanItems: CleanupPlanItem[]
} {
  const primary = getPrimaryMockSourceMedia(input)
  const cleanupPlanId = `${input.projectId}-cleanup-plan`
  const items: CleanupPlanItem[] = []

  input.silenceRegions.forEach((silence, index) => {
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-silence-${String(index + 1).padStart(3, '0')}`,
        input,
        cleanupPlanId,
        mediaAssetId: silence.mediaAssetId,
        sourceRange: silence.sourceRange,
        action: silence.recommendedAction === 'remove' ? 'remove' : 'tighten',
        reason: 'silence',
        label: silence.recommendedAction === 'remove' ? 'Remove dead air' : 'Tighten pause',
        explanation: silence.recommendedAction === 'remove'
          ? 'Remove obvious dead air while keeping the raw source untouched.'
          : 'Tighten the pause without changing the meaning of the sentence.',
      }),
    )
  })

  const falseStart = input.transcriptSegments.find((segment) => /start again|wait/i.test(segment.text))
  if (falseStart) {
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-false-start`,
        input,
        cleanupPlanId,
        mediaAssetId: falseStart.mediaAssetId,
        sourceRange: falseStart.sourceRange,
        action: 'remove',
        reason: 'false_start',
        label: 'Remove false start',
        explanation: 'The opening false start is replaced by the stronger take later in the source.',
      }),
    )
  }

  input.retakeGroups.forEach((group, index) => {
    if (!group.selectedBestRange) return
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-best-take-${String(index + 1).padStart(3, '0')}`,
        input,
        cleanupPlanId,
        mediaAssetId: group.mediaAssetId,
        sourceRange: group.selectedBestRange,
        action: 'keep_best_take',
        reason: 'retake',
        label: group.label ?? 'Keep best take',
        explanation: group.reasoning ?? 'Keep the strongest candidate from the retake group.',
        confidence: group.confidence,
      }),
    )
  })

  const emotionalOrProofSegment = input.transcriptSegments.find((segment) => /private|proof|story|feel/i.test(segment.text))
  if (emotionalOrProofSegment) {
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-preserve-context`,
        input,
        cleanupPlanId,
        mediaAssetId: emotionalOrProofSegment.mediaAssetId,
        sourceRange: emotionalOrProofSegment.sourceRange,
        action: 'preserve',
        reason: 'important_context',
        label: 'Preserve important context',
        explanation: 'This section carries story or proof context and should not be cut in a misleading way.',
      }),
    )
  }

  const ctaSegment = input.transcriptSegments.find((segment) => /send me|full tour|next screen|message/i.test(segment.text))
  if (ctaSegment) {
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-preserve-cta`,
        input,
        cleanupPlanId,
        mediaAssetId: ctaSegment.mediaAssetId,
        sourceRange: ctaSegment.sourceRange,
        action: 'keep',
        reason: 'cta_candidate',
        label: 'Preserve CTA',
        explanation: 'The ending gives the clean assembly a clear next action.',
      }),
    )
  }

  const badOrSensitiveFlag = input.sourceQualityFlags.find((flag) => flag.type === 'bad_take' || flag.type === 'privacy_sensitive')
  if (badOrSensitiveFlag?.sourceRange) {
    items.push(
      cleanupItem({
        id: `${input.projectId}-cleanup-item-review-quality`,
        input,
        cleanupPlanId,
        mediaAssetId: primary.mediaAssetId,
        sourceRange: badOrSensitiveFlag.sourceRange,
        action: 'review',
        reason: badOrSensitiveFlag.type === 'privacy_sensitive' ? 'bad_visual' : 'other',
        label: 'Review quality risk',
        explanation: badOrSensitiveFlag.message,
        confidence: badOrSensitiveFlag.confidence,
      }),
    )
  }

  const cleanupPlan: CleanupPlan = {
    id: cleanupPlanId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId: input.footagePrepSessionId,
    sourceUnderstandingMapId: input.sourceUnderstandingMap.id,
    status: 'ready',
    itemIds: items.map((item) => item.id),
    summary:
      'I found long silence, false starts, repeated takes, and a stronger story path. The clean assembly keeps the best takes while preserving important context.',
    estimatedOriginalDurationMs: originalDuration(input),
    estimatedCleanDurationMs: cleanDuration(input),
    createdFromModel: 'mock-footage-prep-runtime',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  return { cleanupPlan, cleanupPlanItems: items }
}
