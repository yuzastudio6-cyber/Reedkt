import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  ProductionReadinessCheck,
  ToolLicenseReview,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineProductionReadinessCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function riskAccent(review: ToolLicenseReview): 'danger' | 'warning' | 'success' | 'muted' {
  if (review.licenseRisk === 'blocked' || review.reviewStatus === 'rejected') {
    return 'danger'
  }

  if (review.licenseRisk === 'high' || review.licenseRisk === 'unknown' || review.reviewStatus === 'needs_legal_review' || review.reviewStatus === 'not_reviewed') {
    return 'warning'
  }

  if (review.reviewStatus === 'approved' || review.reviewStatus === 'approved_with_conditions') {
    return 'success'
  }

  return 'muted'
}

function severityRank(check: ProductionReadinessCheck) {
  if (check.severity === 'blocking') return 0
  if (check.severity === 'error') return 1
  if (check.severity === 'warning') return 2
  return 3
}

function importantChecks(checks: ProductionReadinessCheck[]) {
  return [...checks]
    .sort((a, b) => severityRank(a) - severityRank(b))
    .slice(0, 8)
}

export function InlineProductionReadinessCard({ descriptor, plan }: InlineProductionReadinessCardProps) {
  const report = plan.productionReadinessReport

  if (!report) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="production-readiness-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{label(report.overallStatus)}</span>
          <span className="compact-summary-chip">{report.needsReviewItems.length} review</span>
          <span className="compact-summary-chip">{report.blockedItems.length} blocked</span>
          <span className="compact-summary-chip">not legal advice</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Production review"
      helper="Production readiness checks licensing, worker/runtime, privacy, security, performance, provider rules, and launch blockers. This is not legal advice and does not approve production use."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Production readiness"
    >
      <div className="production-readiness-summary-grid">
        <span><strong>{label(report.overallStatus)}</strong>Overall status</span>
        <span><strong>{report.frontendInstalledTools.length}</strong>Frontend tools</span>
        <span><strong>{report.workerOnlyTools.length}</strong>Worker-only tools</span>
        <span><strong>{report.providerModels.length}</strong>Provider models</span>
        <span><strong>{report.blockedItems.length}</strong>Blocked</span>
        <span><strong>{report.needsReviewItems.length}</strong>Needs review</span>
        <span><strong>{report.approvedPrototypeItems.length}</strong>Prototype-approved</span>
      </div>

      <div className="understanding-chip-row">
        <Badge accent="warning">Not legal advice</Badge>
        <Badge accent={report.needsReviewItems.length ? 'warning' : 'muted'}>Needs license review</Badge>
        <span className="worker-only-note">Worker-only</span>
        <span className="frontend-preview-only-note">Frontend preview only</span>
        <Badge accent="cyan">Provider terms review</Badge>
        <Badge accent="warning">Privacy review</Badge>
        <Badge accent="warning">Performance review</Badge>
        {report.blockedItems.length > 0 && <Badge accent="danger">Production blocked</Badge>}
        <Badge accent="muted">Prototype only</Badge>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Important checks</summary>
        <div className="production-check-list">
          {importantChecks(report.checks).map((check) => (
            <article className={`production-check-item production-check-${check.severity}`} key={check.id}>
              <div>
                <span className="section-eyebrow">{label(check.category)}</span>
                <h4>{check.label}</h4>
                <p>{check.message}</p>
              </div>
              <div className="layout-mode-meta">
                <span><strong>Status</strong>{label(check.status)}</span>
                <span><strong>Severity</strong>{check.severity}</span>
                <span><strong>Recommendation</strong>{check.recommendation}</span>
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Tool license review</summary>
        <div className="license-review-list">
          {report.licenseReviews.map((review) => (
            <article className="license-review-item" key={`${review.toolId}-${review.toolLabel}`}>
              <div>
                <span className="section-eyebrow">{label(review.productionClass)}</span>
                <h4>{review.toolLabel}</h4>
                <p>{review.notes.slice(0, 2).join(' ')}</p>
              </div>
              <div className="worker-step-meta">
                <span className="production-class-badge">{label(review.productionClass)}</span>
                <span className={`license-risk-badge license-risk-${review.licenseRisk}`}>{label(review.licenseRisk)}</span>
                <span className="license-status-badge">{label(review.reviewStatus)}</span>
                <span><strong>Commercial</strong>{review.commercialUseReviewed ? 'reviewed' : 'not reviewed'}</span>
                <span><strong>Attribution</strong>{review.attributionRequired ? 'required' : 'not reviewed'}</span>
                <span><strong>Redistribution</strong>{review.redistributionConcern ? 'review' : 'not flagged'}</span>
                <span><strong>SaaS/server</strong>{review.saasServerUseConcern ? 'review' : 'not flagged'}</span>
                {review.declaredLicense && <span><strong>License</strong>{review.declaredLicense}</span>}
              </div>
              <Badge accent={riskAccent(review)}>{label(review.reviewStatus)}</Badge>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Launch checklist</summary>
        <div className="launch-checklist-list">
          {report.launchChecklist.map((item) => (
            <article className="launch-checklist-item" key={item.id}>
              <span className="production-status-badge">{label(item.status)}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.message}</p>
              </div>
            </article>
          ))}
        </div>
      </details>

      <div className="not-legal-advice-note">
        <strong>Limitations</strong>
        {report.limitations.map((limitation) => (
          <span className="production-limitation-note" key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
