import type { PlanValidationCheck, PlannerRegressionReport } from '../../lib/planner-validation'
import type { ChatPlanningCardDescriptor } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlinePlannerRegressionCardProps = {
  report: PlannerRegressionReport
  descriptor?: ChatPlanningCardDescriptor
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusAccent(status: PlannerRegressionReport['status']) {
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

function importantChecks(report: PlannerRegressionReport) {
  const scenarioChecks = report.scenarioReports.flatMap((scenario) =>
    scenario.report.checks
      .filter((check) => !check.passed)
      .map((check) => ({
        ...check,
        label: `${scenario.scenarioLabel}: ${check.label}`,
      })),
  )
  const globalChecks = report.globalChecks
    .filter((check) => !check.passed)
    .map((check) => ({
      ...check,
      label: `Global: ${check.label}`,
    }))

  return [...scenarioChecks, ...globalChecks].sort((a, b) => severityRank(a) - severityRank(b)).slice(0, 8)
}

export function InlinePlannerRegressionCard({ descriptor, report }: InlinePlannerRegressionCardProps) {
  const failedChecks = importantChecks(report)
  const passedScenarioCount = report.scenarioReports.filter((scenario) => scenario.report.status === 'passed').length

  return (
    <InlinePlanCardShell
      className="planner-regression-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{report.status}</span>
          <span className="compact-summary-chip">{report.scenarioReports.length} scenarios</span>
          <span className="compact-summary-chip">{report.warningCount} warnings</span>
          <span className="compact-summary-chip">{report.errorCount + report.blockingCount} errors/blocking</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Regression validation"
      helper="This mock regression suite checks that every demo scenario follows ReeditPro's hard product rules before real generation or rendering is implemented."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Planner regression checks"
    >
      <div className="qa-badge-row">
        <Badge accent={statusAccent(report.status)}>{report.status}</Badge>
      </div>

      <div className="qa-badge-row">
        <Badge accent="cyan">Basic/Pro no Veo</Badge>
        <Badge accent="warning">Premium fallback-only Veo</Badge>
        <Badge accent="blue">No default 1080P</Badge>
        <Badge accent="success">Matching panel background</Badge>
        <Badge accent="warning">Approval required</Badge>
      </div>

      <div className="regression-summary-grid">
        <span><strong>Status</strong>{report.status}</span>
        <span><strong>Scenarios passed</strong>{passedScenarioCount} / {report.scenarioReports.length}</span>
        <span><strong>Warnings</strong>{report.warningCount}</span>
        <span><strong>Errors/blocking</strong>{report.errorCount + report.blockingCount}</span>
      </div>
      <p className="inline-helper">{report.summary}</p>

      <div className="regression-scenario-list">
        {report.scenarioReports.map((scenario) => (
          <article className={`regression-scenario-item regression-status-${scenario.report.status}`} key={scenario.scenarioId}>
            <div>
              <strong>{scenario.scenarioLabel}</strong>
              <small>{formatLabel(scenario.editingCategory)} / {scenario.editLevel}</small>
            </div>
            <span>{scenario.report.status}</span>
            <small>
              {scenario.report.blockingCount + scenario.report.errorCount} error/blocking, {scenario.report.warningCount} warning
            </small>
          </article>
        ))}
      </div>

      {failedChecks.length > 0 ? (
        <div className="regression-check-list">
          {failedChecks.map((check) => (
            <article className={`regression-check-item regression-check-${check.severity}`} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <small>{formatLabel(check.category)} / {formatLabel(check.severity)}</small>
              </div>
              <p>{check.message}</p>
              {check.recommendation && <span>{check.recommendation}</span>}
            </article>
          ))}
        </div>
      ) : (
        <p className="prompt-policy-note">All demo scenarios passed the current hard planner rules.</p>
      )}

      <details className="compact-card-details">
        <summary>Global regression checks</summary>
        <div className="regression-check-list">
          {report.globalChecks.map((check) => (
            <article className={`regression-check-item regression-check-${check.severity}`} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <small>{check.passed ? 'passed' : 'needs attention'}</small>
              </div>
              <p>{check.message}</p>
            </article>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
