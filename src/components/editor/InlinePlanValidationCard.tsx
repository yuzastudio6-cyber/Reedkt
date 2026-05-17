import type { PlanValidationCheck, PlanValidationReport } from '../../lib/planner-validation'
import type { ChatPlanningCardDescriptor } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlinePlanValidationCardProps = {
  report: PlanValidationReport
  descriptor?: ChatPlanningCardDescriptor
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusAccent(status: PlanValidationReport['status']) {
  if (status === 'failed') {
    return 'danger'
  }

  if (status === 'warning') {
    return 'warning'
  }

  return 'success'
}

function severityRank(check: PlanValidationCheck) {
  const rank = {
    blocking: 0,
    error: 1,
    warning: 2,
    info: 3,
  }

  return rank[check.severity]
}

function visibleChecks(checks: PlanValidationCheck[]) {
  const important = checks
    .filter((check) => !check.passed || check.severity === 'blocking' || check.severity === 'error')
    .sort((a, b) => severityRank(a) - severityRank(b))

  return important.slice(0, 8)
}

export function InlinePlanValidationCard({ descriptor, report }: InlinePlanValidationCardProps) {
  const visible = visibleChecks(report.checks)

  return (
    <InlinePlanCardShell
      className="plan-validation-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{report.status}</span>
          <span className="compact-summary-chip">{report.passedCount} passed</span>
          <span className="compact-summary-chip">{report.warningCount} warnings</span>
          <span className="compact-summary-chip">{report.errorCount + report.blockingCount} errors/blocking</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? report.status !== 'passed'}
      eyebrow="Planning validation"
      helper="This mock validator checks whether the plan follows ReeditPro's product rules before any real generation or rendering would start."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Planning validation"
    >
      <div className="qa-badge-row">
        <Badge accent={statusAccent(report.status)}>{report.status}</Badge>
      </div>

      <div className="qa-badge-row">
        <Badge accent="cyan">Basic/Pro no Veo</Badge>
        <Badge accent="warning">Premium fallback-only Veo</Badge>
        <Badge accent="blue">Matching panel background</Badge>
        <Badge accent="warning">Approval required</Badge>
        <Badge accent="success">Professional baseline</Badge>
      </div>

      <div className="plan-validation-summary">
        <span><strong>Status</strong>{report.status}</span>
        <span><strong>Passed</strong>{report.passedCount} checks</span>
        <span><strong>Warnings</strong>{report.warningCount}</span>
        <span><strong>Errors/blocking</strong>{report.errorCount + report.blockingCount}</span>
      </div>
      <p className="inline-helper">{report.summary}</p>

      <div className="validation-check-list">
        {visible.map((check) => (
          <article
            className={`validation-check-item ${check.passed ? 'validation-check-passed' : 'validation-check-failed'} validation-severity-${check.severity}`}
            key={check.id}
          >
            <div>
              <strong>{check.label}</strong>
              <small>{formatLabel(check.category)} / {formatLabel(check.severity)} / {check.passed ? 'passed' : 'needs attention'}</small>
            </div>
            <p>{check.message}</p>
            {check.relatedField && <span>{check.relatedField}</span>}
            {check.recommendation && <span>{check.recommendation}</span>}
          </article>
        ))}
      </div>

      {report.checks.length > visible.length && (
        <details className="compact-card-details">
          <summary>{report.checks.length - visible.length} additional validation checks</summary>
          <div className="validation-check-list">
            {report.checks
              .filter((check) => !visible.some((visibleCheck) => visibleCheck.id === check.id))
              .map((check) => (
                <article
                  className={`validation-check-item ${check.passed ? 'validation-check-passed' : 'validation-check-failed'} validation-severity-${check.severity}`}
                  key={check.id}
                >
                  <div>
                    <strong>{check.label}</strong>
                    <small>{formatLabel(check.category)} / {formatLabel(check.severity)} / {check.passed ? 'passed' : 'needs attention'}</small>
                  </div>
                  <p>{check.message}</p>
                  {check.recommendation && <span>{check.recommendation}</span>}
                </article>
              ))}
          </div>
        </details>
      )}
    </InlinePlanCardShell>
  )
}
