import { Badge } from '../../Badge'
import type { ProfessionalQaSummary } from '../../../types'

type ProfessionalQaSummaryCardProps = {
  summary: ProfessionalQaSummary
  readinessMessage?: string
}

function statusLabel(status: ProfessionalQaSummary['status']) {
  if (status === 'not_run') return 'Not run'
  if (status === 'accepted_with_warnings') return 'Accepted with warnings'
  return status.replace(/_/g, ' ')
}

function reviewLabel(readiness: ProfessionalQaSummary['previewReadiness']) {
  if (readiness === 'ready_with_warnings') return 'Ready with warnings'
  return readiness.replace(/_/g, ' ')
}

export function ProfessionalQaSummaryCard({
  readinessMessage,
  summary,
}: ProfessionalQaSummaryCardProps) {
  return (
    <section className="inline-chat-card professional-qa-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Professional QA summary</span>
          <h3>{readinessMessage ?? 'Run QA before treating the private review as ready.'}</h3>
        </div>
        <Badge accent={summary.status === 'blocked' ? 'danger' : summary.status === 'passed' ? 'success' : 'warning'}>
          {statusLabel(summary.status)}
        </Badge>
      </div>

      <div className="professional-qa-stat-grid">
        <span>
          <strong>{reviewLabel(summary.previewReadiness)}</strong>
          <small>Review readiness</small>
        </span>
        <span>
          <strong>{summary.blockingCount}</strong>
          <small>Blocking issues</small>
        </span>
        <span>
          <strong>{summary.warningCount}</strong>
          <small>Warnings</small>
        </span>
        <span>
          <strong>{summary.acceptedWarningCount}</strong>
          <small>Accepted warnings</small>
        </span>
        <span>
          <strong>{summary.passedCount}</strong>
          <small>Passed checks</small>
        </span>
        <span>
          <strong>{summary.totalItems}</strong>
          <small>Total QA items</small>
        </span>
      </div>

      <div className="professional-qa-next-actions">
        {summary.nextRecommendedActions.map((action) => (
          <span key={action}>{action}</span>
        ))}
      </div>
    </section>
  )
}
