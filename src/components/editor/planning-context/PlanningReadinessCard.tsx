import { Badge } from '../../Badge'
import type { PlanningContextStatus, PlanningContextSummary } from '../../../types'

type PlanningReadinessCardProps = {
  summary: PlanningContextSummary
  status: PlanningContextStatus
  readinessMessage?: string
}

function statusLabel(status: PlanningContextStatus) {
  if (status === 'needs_review') return 'Needs review'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusAccent(status: PlanningContextStatus) {
  if (status === 'ready') return 'success'
  if (status === 'blocked') return 'warning'
  return 'muted'
}

export function PlanningReadinessCard({
  readinessMessage,
  status,
  summary,
}: PlanningReadinessCardProps) {
  return (
    <section className="inline-chat-card planning-readiness-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Planning readiness</span>
          <h3>{status === 'ready' ? 'Ready to create the AI Edit Plan' : 'Review planning context'}</h3>
        </div>
        <Badge accent={statusAccent(status)}>{statusLabel(status)}</Badge>
      </div>

      <p className="inline-helper">
        {readinessMessage ?? (status === 'ready'
          ? 'Ready to create the AI Edit Plan.'
          : status === 'blocked'
            ? 'Resolve blocking issues before generation.'
            : 'You can create a draft plan, but review warnings first.')}
      </p>

      <div className="planning-context-stat-grid">
        <span><strong>{summary.blockingIssues}</strong><small>Blocking issues</small></span>
        <span><strong>{summary.warnings}</strong><small>Warnings</small></span>
        <span><strong>{summary.readyCues}</strong><small>Ready cue inputs</small></span>
        <span><strong>{summary.unresolvedConflicts}</strong><small>Open conflicts</small></span>
      </div>

      <div className="planning-next-actions">
        {summary.nextRecommendedActions.map((action) => (
          <span key={action}>{action}</span>
        ))}
      </div>
    </section>
  )
}
