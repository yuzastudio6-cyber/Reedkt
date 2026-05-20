import { Badge } from '../../Badge'
import { InlinePlanCardShell } from '../InlinePlanCardShell'
import {
  formatEventWindow,
  formatTimingLabel,
  timingTrackLabels,
  type TimingEventGroupView,
} from './timingChatUiData'

type InlineTimingEventCardProps = {
  eventGroups: TimingEventGroupView[]
  totalEventCount: number
}

function trackAccent(trackType: string) {
  if (trackType === 'captions') return 'cyan' as const
  if (trackType === 'music') return 'violet' as const
  if (trackType === 'sfx') return 'success' as const
  if (trackType === 'stroke_motion' || trackType === 'graphic_design' || trackType === 'real_motion') return 'blue' as const
  if (trackType === 'render_markers') return 'info' as const
  return 'muted' as const
}

export function InlineTimingEventCard({ eventGroups, totalEventCount }: InlineTimingEventCardProps) {
  return (
    <InlinePlanCardShell
      className="timing-inline-card timing-event-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{totalEventCount} events</span>
          <span className="compact-summary-chip">{eventGroups.length} tracks</span>
          <span className="compact-summary-chip">Grouped by track</span>
        </div>
      )}
      defaultExpanded
      eyebrow="Timing events"
      helper="Events are grouped by track so the chat does not become a technical timeline."
      priority="advanced_plan_detail"
      status="ready"
      title="Event groups"
    >
      <div className="timing-event-group-grid">
        {eventGroups.map((group) => (
          <article className="timing-event-group" key={group.trackType}>
            <div className="timing-list-heading">
              <div>
                <strong>{group.label}</strong>
                <small>{group.count} timing event{group.count === 1 ? '' : 's'}</small>
              </div>
              <Badge accent={trackAccent(group.trackType)}>{timingTrackLabels[group.trackType] ?? formatTimingLabel(group.trackType)}</Badge>
            </div>
            <div className="timing-list timing-event-preview-list">
              {group.events.slice(0, 3).map((event) => (
                <div className="timing-mini-row" key={event.id}>
                  <strong>{event.label}</strong>
                  <span>{formatTimingLabel(event.eventType)} / {formatEventWindow(event)}</span>
                </div>
              ))}
            </div>
            {group.events.length > 3 && (
              <details className="compact-card-details">
                <summary>Show remaining {group.label} events</summary>
                <div className="timing-detail-stack">
                  {group.events.slice(3).map((event) => (
                    <span key={event.id}>{event.label}: {formatTimingLabel(event.eventType)} / {formatEventWindow(event)}</span>
                  ))}
                </div>
              </details>
            )}
          </article>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
