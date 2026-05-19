import { Badge } from '../../Badge'
import type { SFXEventPlanRecord } from '../../../types'
import { formatSFXLabel, formatSFXSeconds } from './sfxChatUiData'

type InlineSFXEventCardProps = {
  eventPlan: SFXEventPlanRecord
  index: number
}

export function InlineSFXEventCard({ eventPlan, index }: InlineSFXEventCardProps) {
  const shouldWarn = eventPlan.decisionState === 'avoid' || eventPlan.targetLayer === 'source_footage_repair'

  return (
    <section className="inline-chat-card sfx-inline-card sfx-event-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cue / Event {index + 1}</span>
          <h3>{eventPlan.userVisibleSummary}</h3>
        </div>
        <Badge accent={eventPlan.decisionState === 'needed' ? 'success' : shouldWarn ? 'warning' : 'cyan'}>
          {formatSFXLabel(eventPlan.decisionState)}
        </Badge>
      </div>

      {shouldWarn && (
        <p className="sfx-warning">
          {eventPlan.decisionState === 'avoid'
            ? `Avoid this SFX: ${eventPlan.reason}`
            : 'Source-footage repair is not default behavior. It requires a professional reason or explicit user request.'}
        </p>
      )}

      <div className="sfx-score-grid">
        <span><strong>Target layer</strong>{formatSFXLabel(eventPlan.targetLayer)}</span>
        <span><strong>Use case</strong>{formatSFXLabel(eventPlan.useCase)}</span>
        <span><strong>Anchor</strong>{formatSFXLabel(eventPlan.anchorType)} at {formatSFXSeconds(eventPlan.anchorTimeSeconds)}</span>
        <span><strong>Volume</strong>{formatSFXLabel(eventPlan.volumeProfile)}</span>
        <span><strong>Mix priority</strong>{formatSFXLabel(eventPlan.mixPriority)}</span>
        <span><strong>Credit impact</strong>{formatSFXLabel(eventPlan.creditImpact)}</span>
        <span><strong>Status</strong>{formatSFXLabel(eventPlan.status)}</span>
        <span><strong>Signature system</strong>{formatSFXLabel(eventPlan.signatureSystem)}</span>
      </div>

      <details className="sfx-details">
        <summary>Why this cue exists</summary>
        <p>{eventPlan.reason}</p>
        <p>{eventPlan.sceneContext}</p>
        <p>Video tone: {eventPlan.videoTone}</p>
      </details>
    </section>
  )
}
