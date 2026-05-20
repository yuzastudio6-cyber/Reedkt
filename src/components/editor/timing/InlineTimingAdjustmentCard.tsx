import { HelpCircle, Search, Settings, Undo2, Wand2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { StoryTimingAdjustmentRecommendationRecord } from '../../../types/storytiming'
import { formatTimingLabel, formatTimingSeconds } from './timingChatUiData'

type InlineTimingAdjustmentCardProps = {
  recommendations: StoryTimingAdjustmentRecommendationRecord[]
  onAction: (message: string) => void
}

export function InlineTimingAdjustmentCard({ onAction, recommendations }: InlineTimingAdjustmentCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-adjustment-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{recommendations.length} suggested fixes</span>
          <span className="compact-summary-chip">{recommendations.filter((item) => item.requiresUserApproval).length} need approval</span>
        </div>
      )}
      defaultExpanded={recommendations.length > 0}
      eyebrow="Timing fixes"
      helper="These buttons update only the mock chat state. No backend timing records are changed."
      priority={recommendations.some((item) => item.requiresUserApproval) ? 'required_user_action' : 'user_summary'}
      status={recommendations.length > 0 ? 'warning' : 'ready'}
      title={recommendations.length > 0 ? 'Recommended adjustments' : 'No timing adjustments needed'}
    >
      {recommendations.length === 0 ? (
        <p className="timing-success">No timing fixes are needed for this mock review.</p>
      ) : (
        <div className="timing-list">
          {recommendations.map((recommendation) => (
            <article className="timing-list-item" key={recommendation.id}>
              <div className="timing-list-heading">
                <div>
                  <strong>{formatTimingLabel(recommendation.recommendedAction)}</strong>
                  <small>{recommendation.userFacingSummary}</small>
                </div>
                <Badge accent={recommendation.requiresUserApproval ? 'warning' : 'success'}>
                  Approval: {formatTimingLabel(recommendation.requiresUserApproval)}
                </Badge>
              </div>
              <div className="timing-pill-row">
                <span className="timing-chip">Adjustment: {formatTimingLabel(recommendation.adjustmentType)}</span>
                <span className="timing-chip">Shift: {formatTimingSeconds(recommendation.timeShiftSeconds)}</span>
                <span className="timing-chip">Events: {recommendation.relatedEventIds.length}</span>
                <span className="timing-chip">Anchors: {recommendation.relatedAnchorIds.length}</span>
              </div>
              <p>{recommendation.reason}</p>
              <div className="inline-card-actions timing-action-row">
                <Button
                  icon={Wand2}
                  onClick={() => onAction(`Applied mock timing fix: ${recommendation.userFacingSummary}`)}
                  size="sm"
                  variant="primary"
                >
                  Apply mock fix
                </Button>
                <Button
                  icon={Undo2}
                  onClick={() => onAction(`Ignored timing warning for now: ${recommendation.userFacingSummary}`)}
                  size="sm"
                  variant="secondary"
                >
                  Ignore warning
                </Button>
                <Button
                  icon={HelpCircle}
                  onClick={() => onAction(`User review requested: ${recommendation.userFacingSummary}`)}
                  size="sm"
                  variant="ghost"
                >
                  Ask user
                </Button>
                <Button
                  icon={Settings}
                  onClick={() => onAction(`Keeping current timing for this mock review: ${recommendation.userFacingSummary}`)}
                  size="sm"
                  variant="ghost"
                >
                  Keep current timing
                </Button>
                <Button
                  icon={Search}
                  onClick={() => onAction(`Manual review noted for: ${recommendation.userFacingSummary}`)}
                  size="sm"
                  variant="ghost"
                >
                  Manual review
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </InlinePlanCardShell>
  )
}
