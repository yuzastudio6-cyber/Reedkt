import type { TestingReadinessCheck, TestingReadinessStatus } from '../../types/testing-readiness'
import type { EditPlan } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineTestingReadinessCardProps = {
  plan: EditPlan
}

const severityRank: Record<TestingReadinessCheck['severity'], number> = {
  blocking: 0,
  error: 1,
  warning: 2,
  info: 3,
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusAccent(status: TestingReadinessStatus) {
  if (status === 'blocked') return 'danger'
  if (status === 'warning' || status === 'not_checked') return 'warning'
  return 'success'
}

export function InlineTestingReadinessCard({ plan }: InlineTestingReadinessCardProps) {
  const report = plan.testingReadinessReport

  if (!report) {
    return null
  }

  const importantChecks = [...report.checks]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, 12)

  return (
    <InlinePlanCardShell
      className="testing-readiness-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className={`testing-readiness-status-badge testing-readiness-${report.overallStatus}`}>{formatLabel(report.overallStatus)}</span>
          <span className="compact-summary-chip">{report.blockers.length} blockers</span>
          <span className="compact-summary-chip">{report.warnings.length} warnings</span>
          <span className="compact-summary-chip">{report.checks.length} checks</span>
        </div>
      )}
      defaultExpanded={report.overallStatus === 'blocked'}
      eyebrow="Testing readiness"
      helper="This checks whether the repo is ready for local/staging testing. It does not run providers, tools, SQL, Supabase, cloud, or rendering."
      priority="developer_detail"
      status={report.overallStatus === 'blocked' ? 'blocking' : report.overallStatus === 'warning' ? 'warning' : 'ready'}
      title="Testing readiness"
    >
      <div className="qa-badge-row">
        <Badge accent={statusAccent(report.overallStatus)}>{formatLabel(report.overallStatus)}</Badge>
        <Badge accent="blue">Mock only</Badge>
        <Badge accent="warning">Manual test required</Badge>
        <Badge accent="violet">Local/staging only</Badge>
        <Badge accent="cyan">No real execution</Badge>
      </div>

      <p className="inline-helper">{report.summary}</p>

      <div className="testing-readiness-summary-grid">
        <span><strong>Status</strong>{formatLabel(report.overallStatus)}</span>
        <span><strong>Checks</strong>{report.checks.length}</span>
        <span><strong>Blockers</strong>{report.blockers.length}</span>
        <span><strong>Warnings</strong>{report.warnings.length}</span>
      </div>

      <div className="testing-readiness-no-real-execution-note">
        {report.limitations.join(' ')}
      </div>

      {report.blockers.length > 0 && (
        <div className="testing-readiness-blocker-list">
          <strong>Blockers</strong>
          {report.blockers.map((blocker) => (
            <span key={blocker}>{blocker}</span>
          ))}
        </div>
      )}

      {report.warnings.length > 0 && (
        <details className="compact-card-details">
          <summary>Warnings</summary>
          <div className="testing-readiness-warning-list">
            {report.warnings.map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        </details>
      )}

      <details className="compact-card-details" open={report.overallStatus === 'blocked'}>
        <summary>Readiness checks</summary>
        <div className="testing-readiness-check-list">
          {importantChecks.map((check) => (
            <article className={`testing-readiness-check-item testing-readiness-${check.severity}`} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <span className={`testing-readiness-status-badge testing-readiness-${check.status}`}>
                  {formatLabel(check.status)}
                </span>
              </div>
              <small>{formatLabel(check.category)} / {check.passed ? 'passed' : 'needs attention'}</small>
              <p>{check.message}</p>
              {check.recommendation && <em>{check.recommendation}</em>}
            </article>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Manual test steps</summary>
        <ol className="testing-readiness-manual-step-list">
          {report.manualTestSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>

      <details className="compact-card-details">
        <summary>Next milestones</summary>
        <div className="testing-readiness-warning-list">
          {report.nextMilestones.map((milestone) => (
            <span key={milestone}>{milestone}</span>
          ))}
        </div>
      </details>

      <div className="testing-readiness-manual-required-note">
        Build, lint, readiness script, and manual local/staging smoke testing still run outside this card.
      </div>
    </InlinePlanCardShell>
  )
}
