import { Badge } from '../../Badge'
import type { ProfessionalIntegrationSummary } from '../../../types'

type ProfessionalIntegrationSummaryCardProps = {
  summary: ProfessionalIntegrationSummary
  readinessMessage?: string
}

function statusLabel(status: ProfessionalIntegrationSummary['status']) {
  if (status === 'needs_review') return 'Needs review'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusAccent(status: ProfessionalIntegrationSummary['status']) {
  if (status === 'ready' || status === 'accepted') return 'success'
  if (status === 'blocked') return 'warning'
  return 'muted'
}

export function ProfessionalIntegrationSummaryCard({
  readinessMessage,
  summary,
}: ProfessionalIntegrationSummaryCardProps) {
  return (
    <section className="inline-chat-card professional-integration-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Professional Integration readiness</span>
          <h3>{summary.status === 'accepted' ? 'Treatment decisions accepted' : 'Professional treatment summary'}</h3>
        </div>
        <Badge accent={statusAccent(summary.status)}>{statusLabel(summary.status)}</Badge>
      </div>
      <p className="inline-helper">{readinessMessage}</p>

      <div className="professional-integration-stat-grid">
        <span><strong>{summary.assetTreatmentCount}</strong><small>Asset treatments</small></span>
        <span><strong>{summary.brollTreatmentCount}</strong><small>B-roll plans</small></span>
        <span><strong>{summary.overlayTreatmentCount}</strong><small>Overlay plans</small></span>
        <span><strong>{summary.cueComplianceCheckCount}</strong><small>Cue checks</small></span>
        <span><strong>{summary.qaRiskCount}</strong><small>QA risks</small></span>
        <span><strong>{summary.blockingIssueCount}</strong><small>Blocking issues</small></span>
        <span><strong>{summary.warningIssueCount}</strong><small>Warnings</small></span>
        <span><strong>{summary.accepted ? 'Yes' : 'No'}</strong><small>Accepted</small></span>
      </div>

      <div className="professional-next-actions">
        {summary.nextRecommendedActions.map((action) => (
          <span key={action}>{action}</span>
        ))}
      </div>
    </section>
  )
}
