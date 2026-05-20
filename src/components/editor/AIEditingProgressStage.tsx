import { Badge } from '../Badge'
import { progressSteps } from './chatNativeData'
import { AIProgressStepList } from './AIProgressStepList'

type AIEditingProgressStageProps = {
  activeIndex: number
  complete: boolean
  events?: string[]
  reservationId?: string
  warnings?: string[]
}

export function AIEditingProgressStage({ activeIndex, complete, events = [], reservationId, warnings = [] }: AIEditingProgressStageProps) {
  return (
    <section className="inline-chat-card ai-editing-stage">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">AI editing in background</span>
          <h3>{complete ? 'Mock preview prepared' : 'ReeditPro is editing'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Working'}</Badge>
      </div>
      <div className="ai-stage-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={progressSteps} />
      {(reservationId || events.length > 0) && (
        <div className="local-runtime-event-log">
          {reservationId && (
            <div>
              <strong>Credit reservation</strong>
              <span>{reservationId}</span>
            </div>
          )}
          {events.slice(0, 7).map((event) => (
            <div key={event}>
              <strong>Runtime event</strong>
              <span>{event}</span>
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="local-runtime-warning-list">
          {warnings.slice(0, 3).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
      <p className="inline-helper">
        This is mock progress only. Local MVP routes through credit gates, mock queue, worker lease, dispatch, and preview status without real provider or render work.
      </p>
    </section>
  )
}
