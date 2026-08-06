import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../Badge'
import type {
  FootagePrepSession,
  WorkflowActivityEvent,
  WorkflowProgressSnapshot,
} from '../../../types'

type FootagePrepProgressCardProps = {
  progressSnapshot: WorkflowProgressSnapshot
  activityEvents: WorkflowActivityEvent[]
  footagePrepSession: FootagePrepSession
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ')
}

function formatPercent(value?: number) {
  return `${Math.round(value ?? 0)}%`
}

export function FootagePrepProgressCard({
  activityEvents,
  footagePrepSession,
  progressSnapshot,
}: FootagePrepProgressCardProps) {
  const progressPercent = progressSnapshot.progressPercent ?? footagePrepSession.progressPercent ?? 0
  const latestEvent = progressSnapshot.latestEvent ?? activityEvents.at(-1)

  return (
    <section className="inline-chat-card footage-prep-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source prep</span>
          <h3>{progressSnapshot.activeLabel}</h3>
        </div>
        <Badge accent={progressPercent >= 100 ? 'success' : 'cyan'}>{formatPercent(progressPercent)}</Badge>
      </div>

      <p className="inline-helper">ReeditPro is preparing your raw footage before creative editing.</p>

      <div className="footage-prep-progress-meter" aria-label={`Source prep progress ${formatPercent(progressPercent)}`}>
        <span style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
      </div>

      <div className="footage-prep-current-status">
        <strong>{latestEvent?.title ?? 'Preparing your footage'}</strong>
        <span>{latestEvent?.message ?? 'Building a clean assembly from the source upload.'}</span>
      </div>

      <div className="footage-prep-trust-note">
        <CheckCircle2 aria-hidden="true" size={17} />
        <span>Your original upload is preserved. Cleanup is non-destructive.</span>
      </div>

      <ol className="footage-prep-activity-list" aria-label="Source prep activity">
        {activityEvents.map((event, index) => (
          <li className={`footage-prep-activity-item footage-prep-activity-${event.severity}`} key={`${event.id}-${index}`}>
            <span aria-hidden="true" />
            <div>
              <strong>{event.title}</strong>
              <small>{event.message}</small>
            </div>
            {typeof event.progressPercent === 'number' && <em>{formatPercent(event.progressPercent)}</em>}
          </li>
        ))}
      </ol>

      <div className="compact-summary-row">
        <span className="compact-summary-chip">{formatStatus(footagePrepSession.status)}</span>
        {footagePrepSession.activeStage && <span className="compact-summary-chip">{formatStatus(footagePrepSession.activeStage)}</span>}
        <span className="compact-summary-chip">{footagePrepSession.retryCount ?? 0} retries</span>
      </div>
    </section>
  )
}
