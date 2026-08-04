import type { EditLevelQAGateSummaryModel } from '../../types'

type EditLevelQAGateSummaryProps = {
  summary: EditLevelQAGateSummaryModel
  compact?: boolean
}

export function EditLevelQAGateSummary({
  compact = false,
  summary,
}: EditLevelQAGateSummaryProps) {
  return (
    <section
      className={`edit-level-qa-gate-summary ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-qa-gate-summary"
    >
      <span className="section-eyebrow">QA gates</span>
      <h3>{summary.displayName} QA policy</h3>
      <div className="edit-level-qa-grid">
        <span><strong>{summary.qaStrictnessLabel}</strong><small>QA strictness</small></span>
        <span><strong>{summary.readinessStatusLabel}</strong><small>Readiness</small></span>
        <span><strong>{summary.requiredCount}</strong><small>Required checks</small></span>
        <span><strong>{summary.warningCount}</strong><small>Warning checks</small></span>
        <span><strong>{summary.blockingCount}</strong><small>Blocking checks</small></span>
        <span><strong>{summary.futureGatedCount}</strong><small>Future-gated checks</small></span>
      </div>
      {!compact && (
        <ul>
          {summary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
      <p className="inline-helper">{summary.userFacingSummary}</p>
    </section>
  )
}
