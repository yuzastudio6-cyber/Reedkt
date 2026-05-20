import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { TimingConflictRecord } from '../../../types/storytiming'
import { formatTimingLabel, formatTimingRange, severityAccent } from './timingChatUiData'

type InlineTimingConflictCardProps = {
  conflicts: TimingConflictRecord[]
}

export function InlineTimingConflictCard({ conflicts }: InlineTimingConflictCardProps) {
  const blockingCount = conflicts.filter((conflict) => conflict.blocksRender).length

  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-conflict-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{conflicts.length} conflicts</span>
          <span className="compact-summary-chip">{blockingCount} block render</span>
          <span className="compact-summary-chip">{conflicts.filter((conflict) => conflict.requiresUserReview).length} need review</span>
        </div>
      )}
      defaultExpanded={conflicts.length > 0}
      eyebrow="Timing conflicts"
      helper="Conflicts show what might make timing unclear, distracting, or unsafe for render."
      priority={blockingCount > 0 ? 'required_user_action' : 'safety_detail'}
      status={blockingCount > 0 ? 'blocking' : conflicts.length > 0 ? 'warning' : 'ready'}
      title={conflicts.length > 0 ? 'Timing issues found' : 'No timing conflicts'}
    >
      {conflicts.length === 0 ? (
        <p className="timing-success">No blocking timing conflicts were found in this mock review.</p>
      ) : (
        <div className="timing-list">
          {conflicts.map((conflict) => (
            <article className={`timing-list-item timing-conflict-${conflict.severity}`} key={conflict.id}>
              <div className="timing-list-heading">
                <div>
                  <strong>{formatTimingLabel(conflict.conflictType)}</strong>
                  <small>{formatTimingRange(conflict.timeRange)}</small>
                </div>
                <Badge accent={severityAccent(conflict.severity)}>{formatTimingLabel(conflict.severity)}</Badge>
              </div>
              <p>{conflict.description}</p>
              <div className="timing-pill-row">
                {conflict.sourceSystems.map((system) => (
                  <span className="timing-chip" key={system}>{formatTimingLabel(system)}</span>
                ))}
                <span className="timing-chip">Blocks render: {formatTimingLabel(conflict.blocksRender)}</span>
                <span className="timing-chip">User review: {formatTimingLabel(conflict.requiresUserReview)}</span>
                <span className="timing-chip">Status: {formatTimingLabel(conflict.status)}</span>
              </div>
              <details className="compact-card-details">
                <summary>Why this matters and recommended adjustment</summary>
                <div className="timing-detail-stack">
                  <span>{conflict.whyItMatters}</span>
                  <strong>{formatTimingLabel(conflict.recommendedAdjustment)}</strong>
                  <small>Related events: {conflict.relatedEventIds.slice(0, 4).join(', ') || 'none'}</small>
                  <small>Related anchors: {conflict.relatedAnchorIds.slice(0, 4).join(', ') || 'none'}</small>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </InlinePlanCardShell>
  )
}
