import type { ChatPlanningDisplayMode, ChatPlanningPhaseSummary } from '../../types/reeditpro'

type InlinePlanningProgressCardProps = {
  displayMode: ChatPlanningDisplayMode
  onDisplayModeChange: (mode: ChatPlanningDisplayMode) => void
  phaseSummaries: ChatPlanningPhaseSummary[]
}

const displayModes: { label: string; value: ChatPlanningDisplayMode }[] = [
  { label: 'Guided', value: 'guided' },
  { label: 'Detailed', value: 'detailed' },
  { label: 'Developer', value: 'developer' },
]

function formatStatus(value: string) {
  return value.replaceAll('_', ' ')
}

export function InlinePlanningProgressCard({
  displayMode,
  onDisplayModeChange,
  phaseSummaries,
}: InlinePlanningProgressCardProps) {
  return (
    <section className="inline-chat-card planning-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Guided planning</span>
          <h3>Planning progress</h3>
        </div>
        <div className="chat-display-mode-toggle" aria-label="Planning detail level">
          {displayModes.map((mode) => (
            <button
              aria-pressed={displayMode === mode.value}
              className={displayMode === mode.value ? 'chat-display-mode-active' : ''}
              key={mode.value}
              onClick={() => onDisplayModeChange(mode.value)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <p className="inline-helper">ReeditPro plans the edit before spending credits.</p>

      <div className="planning-phase-list">
        {phaseSummaries.map((phase) => (
          <article className={`planning-phase-item planning-phase-status-${phase.status}`} key={phase.phase}>
            <div>
              <strong>{phase.label}</strong>
              <small>{phase.summary}</small>
            </div>
            <span className="planning-phase-status">{formatStatus(phase.status)}</span>
            <em>{phase.completedCount}/{phase.totalCount}</em>
          </article>
        ))}
      </div>
    </section>
  )
}
