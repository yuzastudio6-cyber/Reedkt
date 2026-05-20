import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import type { TimingAnchorRecord } from '../../../types/storytiming'
import { formatTimingLabel, formatTimingSeconds } from './timingChatUiData'

type InlineTimingAnchorCardProps = {
  anchors: TimingAnchorRecord[]
  totalAnchorCount: number
}

function anchorAccent(anchor: TimingAnchorRecord) {
  if (anchor.anchorType.includes('stroke_motion')) return 'violet' as const
  if (anchor.anchorType.includes('graphic')) return 'cyan' as const
  if (anchor.anchorType.includes('real_motion')) return 'blue' as const
  if (anchor.anchorType.includes('sfx')) return 'success' as const
  if (anchor.importance === 'critical' || anchor.importance === 'high') return 'warning' as const
  return 'muted' as const
}

export function InlineTimingAnchorCard({ anchors, totalAnchorCount }: InlineTimingAnchorCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-anchor-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{anchors.length} shown</span>
          <span className="compact-summary-chip">{totalAnchorCount} total anchors</span>
          <span className="compact-summary-chip">Top anchors first</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Timing anchors"
      helper="Important anchors appear first so timing review stays readable in chat."
      priority="advanced_plan_detail"
      status="ready"
      title="Key anchors"
    >
      <div className="timing-list">
        {anchors.map((anchor) => (
          <article className="timing-list-item" key={anchor.id}>
            <div className="timing-list-heading">
              <div>
                <strong>{anchor.anchorLabel}</strong>
                <small>{anchor.anchorText ?? formatTimingLabel(anchor.anchorType)}</small>
              </div>
              <Badge accent={anchorAccent(anchor)}>{formatTimingLabel(anchor.anchorType)}</Badge>
            </div>
            <div className="timing-pill-row">
              <span className="timing-chip">{formatTimingSeconds(anchor.timeSeconds)}</span>
              {anchor.endTimeSeconds !== undefined && <span className="timing-chip">End {formatTimingSeconds(anchor.endTimeSeconds)}</span>}
              <span className="timing-chip">Source: {formatTimingLabel(anchor.sourceSystem)}</span>
              <span className="timing-chip">Importance: {formatTimingLabel(anchor.importance)}</span>
              <span className="timing-chip">Sync: {formatTimingLabel(anchor.syncMode)}</span>
              <span className="timing-chip">Locked: {formatTimingLabel(anchor.locked)}</span>
            </div>
            <details className="compact-card-details">
              <summary>Anchor source details</summary>
              <div className="timing-detail-stack">
                <span>Primary authority: {formatTimingLabel(anchor.primaryAuthority)}</span>
                <span>Source record: {anchor.sourceRecordId ?? 'not set'}</span>
                {anchor.notes.map((note) => <small key={note}>{note}</small>)}
              </div>
            </details>
          </article>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
