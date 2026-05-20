import type {
  StoryTimingAdjustmentRecommendationRecord,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  TimingConflictRecord,
} from '../../types/storytiming'
import { createReadinessSummary } from './storytiming-readiness-service'

const topConflictSummary = (conflicts: TimingConflictRecord[] = []): string | undefined => {
  const sorted = [...conflicts].sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 }
    return rank[b.severity] - rank[a.severity]
  })
  return sorted[0]?.description
}

export function createTimingReadyChatSummary(report: StoryTimingQAReportRecord): string {
  return `The timing map is ready for preview. Overall timing score is ${report.overallScore}/100.`
}

export function createTimingWarningChatSummary(
  report: StoryTimingQAReportRecord,
  recommendations: StoryTimingAdjustmentRecommendationRecord[] = [],
): string {
  const firstRecommendation = recommendations[0]?.userFacingSummary
  return `The timing is ready with warnings. Overall score is ${report.overallScore}/100.${firstRecommendation ? ` Recommended fix: ${firstRecommendation}` : ''}`
}

export function createTimingBlockedChatSummary(
  report: StoryTimingQAReportRecord,
  conflicts: TimingConflictRecord[] = [],
): string {
  return `Timing is blocked for render. The biggest issue is: ${topConflictSummary(conflicts) ?? 'a render-blocking timing check failed'}. Overall score is ${report.overallScore}/100.`
}

export function createTimingUserReviewChatSummary(
  report: StoryTimingQAReportRecord,
  recommendations: StoryTimingAdjustmentRecommendationRecord[] = [],
): string {
  const reviewItem = recommendations.find((recommendation) => recommendation.requiresUserApproval)
  return `Timing needs user review. ${reviewItem?.userFacingSummary ?? 'A subjective timing choice needs approval before preview/render.'} Overall score is ${report.overallScore}/100.`
}

export function createStoryTimingQAChatSummary(input: {
  qaReport: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  conflicts?: TimingConflictRecord[]
  adjustmentRecommendations?: StoryTimingAdjustmentRecommendationRecord[]
}): string[] {
  const report = input.qaReport
  const conflicts = input.conflicts ?? []
  const recommendations = input.adjustmentRecommendations ?? []
  const failedChecks = (input.qaChecks ?? []).filter((check) => check.status === 'failed' || check.blocksRender).length
  const warningChecks = (input.qaChecks ?? []).filter((check) => check.status === 'warning' || check.status === 'requires_adjustment').length
  const headline = report.readinessDecision === 'ready_for_preview'
    ? createTimingReadyChatSummary(report)
    : report.readinessDecision === 'ready_with_warnings'
      ? createTimingWarningChatSummary(report, recommendations)
      : report.readinessDecision === 'requires_user_review'
        ? createTimingUserReviewChatSummary(report, recommendations)
        : report.readinessDecision === 'blocked_for_render'
          ? createTimingBlockedChatSummary(report, conflicts)
          : `Timing needs adjustment. ${recommendations[0]?.userFacingSummary ?? 'Review timing recommendations before preview.'}`

  return [
    headline,
    createReadinessSummary(report.readinessDecision),
    `${conflicts.length} conflict(s), ${failedChecks} failed/blocking QA check(s), and ${warningChecks} warning/adjustment check(s) were included in the full QA pass.`,
    recommendations.length === 0
      ? 'No timing adjustments are recommended.'
      : `${recommendations.length} timing adjustment recommendation(s) are ready for review.`,
    'Full Timing QA is mock-only; no media processing, rendering, provider calls, or remote persistence occurred.',
  ]
}
