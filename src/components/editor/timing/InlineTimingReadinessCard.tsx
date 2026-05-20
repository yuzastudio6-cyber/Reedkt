import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { StoryTimingQAReportRecord, StoryTimingReadinessDecision } from '../../../types/storytiming'
import { formatTimingLabel, readinessAccent, readinessLabel } from './timingChatUiData'

type InlineTimingReadinessCardProps = {
  qaReport: StoryTimingQAReportRecord
  nextStep: string
}

const readinessCopy: Record<StoryTimingReadinessDecision, string> = {
  blocked_for_render: 'Blocked for render: critical timing conflicts must be fixed before rendering.',
  ready_for_preview: 'Ready for preview: timing checks passed.',
  ready_with_warnings: 'Ready with warnings: preview can continue, but ReeditPro recommends small timing fixes.',
  requires_timing_adjustment: 'Requires timing adjustment: preview should wait until timing issues are fixed.',
  requires_user_review: 'Requires user review: the timing choice is subjective and needs approval.',
}

export function InlineTimingReadinessCard({ nextStep, qaReport }: InlineTimingReadinessCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-readiness-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{readinessLabel(qaReport.readinessDecision)}</span>
          <span className="compact-summary-chip">Next: {formatTimingLabel(nextStep)}</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Preview readiness"
      helper="Readiness explains whether timing can move toward preview or must be adjusted first."
      priority={qaReport.blocksPreview || qaReport.blocksRender ? 'required_user_action' : 'user_summary'}
      status={qaReport.blocksRender ? 'blocking' : qaReport.blocksPreview ? 'warning' : 'ready'}
      title="Timing readiness"
    >
      <div className="timing-readiness-summary">
        <Badge accent={readinessAccent(qaReport.readinessDecision)}>{readinessLabel(qaReport.readinessDecision)}</Badge>
        <p>{readinessCopy[qaReport.readinessDecision]}</p>
      </div>
      <div className="timing-pill-row">
        <span className="timing-chip">Blocks preview: {formatTimingLabel(qaReport.blocksPreview)}</span>
        <span className="timing-chip">Blocks render: {formatTimingLabel(qaReport.blocksRender)}</span>
        <span className="timing-chip">Requires user review: {formatTimingLabel(qaReport.requiresUserReview)}</span>
        <span className="timing-chip">Next step: {formatTimingLabel(nextStep)}</span>
      </div>
    </InlinePlanCardShell>
  )
}
