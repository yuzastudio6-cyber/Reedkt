import type { EditPlan } from '../../types/reeditpro'
import type { RlsAccessDecision, RlsReviewStatus } from '../../types/supabase-rls-hardening'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineMigrationReviewCardProps = {
  plan: EditPlan
}

const severityRank = {
  blocking: 0,
  error: 1,
  warning: 2,
  info: 3,
}

function statusLabel(status: RlsReviewStatus) {
  if (status === 'hardened_draft') return 'Hardened draft'
  if (status === 'ready_for_testing') return 'Ready for testing'
  if (status === 'needs_review') return 'Needs review'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function decisionLabel(decision: RlsAccessDecision) {
  return decision.replaceAll('_', ' ')
}

function checkClass(severity: keyof typeof severityRank, passed: boolean) {
  return `migration-review-check-item migration-review-${passed ? 'passed' : 'failed'} migration-review-${severity}`
}

export function InlineMigrationReviewCard({ plan }: InlineMigrationReviewCardProps) {
  const reviewPlan = plan.migrationReviewPlan

  if (!reviewPlan) {
    return null
  }

  const sortedChecks = [...reviewPlan.checks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
  const rlsChecks = [...reviewPlan.rlsHardeningPlan.checks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
  const immutableSnapshots = reviewPlan.rlsHardeningPlan.tableAccessPlans.some((item) => item.tableName === 'approved_plan_snapshots' && item.immutableAfterApproval)
  const appendOnlyAudit = reviewPlan.rlsHardeningPlan.tableAccessPlans.some((item) => item.tableName === 'audit_events' && item.appendOnly)
  const workerServiceOnly = reviewPlan.rlsHardeningPlan.checks.some((item) => item.id === 'rls-worker-tables-service-only' && item.passed)

  return (
    <InlinePlanCardShell
      className="migration-review-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{statusLabel(reviewPlan.overallStatus)}</span>
          <span className="compact-summary-chip">{reviewPlan.reviewedDraftFiles.length} drafts reviewed</span>
          <span className="compact-summary-chip">{reviewPlan.rlsHardeningPlan.tableAccessPlans.length} table access plans</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Data bridge"
      helper="This reviews the draft SQL and access-control plan before real Supabase migrations are created. No SQL is run in this demo."
      priority="developer_detail"
      status={reviewPlan.overallStatus === 'blocked' ? 'blocking' : 'warning'}
      title="Migration review + RLS hardening"
    >
      <div className="qa-badge-row">
        <Badge accent="blue">Draft only</Badge>
        <Badge accent="violet">No SQL run</Badge>
        <Badge accent="warning">RLS needs testing</Badge>
        <Badge accent={immutableSnapshots ? 'success' : 'warning'}>Approved snapshot immutable</Badge>
        <Badge accent={workerServiceOnly ? 'success' : 'warning'}>Worker service-only</Badge>
        <Badge accent="success">Private storage</Badge>
        <Badge accent={appendOnlyAudit ? 'success' : 'warning'}>Append-only audit</Badge>
        <Badge accent="warning">Needs review</Badge>
      </div>

      <p className="inline-helper">{reviewPlan.summary}</p>

      <div className="migration-review-summary-grid">
        <span><strong>Status</strong>{statusLabel(reviewPlan.overallStatus)}</span>
        <span><strong>Draft files</strong>{reviewPlan.reviewedDraftFiles.length}</span>
        <span><strong>Checks</strong>{reviewPlan.checks.length}</span>
        <span><strong>RLS tables</strong>{reviewPlan.rlsHardeningPlan.tableAccessPlans.length}</span>
      </div>

      <div className="migration-review-no-sql-note">
        {reviewPlan.limitations.join(' ')}
      </div>

      <details className="compact-card-details">
        <summary>Migration review checks</summary>
        <div className="migration-review-check-list">
          {sortedChecks.map((check) => (
            <article className={checkClass(check.severity, check.passed)} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <span className="rls-review-status-badge">{check.passed ? 'Passed' : 'Needs work'} / {check.severity}</span>
              </div>
              <p>{check.message}</p>
              <small>{check.recommendation}</small>
            </article>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>RLS hardening checks</summary>
        <div className="migration-review-check-list">
          {rlsChecks.map((check) => (
            <article className={checkClass(check.severity, check.passed)} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <span className="rls-review-status-badge">{check.passed ? 'Passed' : 'Needs work'} / {check.severity}</span>
              </div>
              <p>{check.message}</p>
              <small>{check.recommendation}</small>
            </article>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Table access matrix</summary>
        <div className="rls-table-access-list">
          {reviewPlan.rlsHardeningPlan.tableAccessPlans.map((accessPlan) => (
            <article className="rls-table-access-item" key={accessPlan.tableName}>
              <div className="migration-draft-meta">
                <strong>{accessPlan.tableName}</strong>
                <span className="rls-sensitivity-badge">{accessPlan.sensitivity}</span>
                <span className="rls-review-status-badge">{statusLabel(accessPlan.reviewStatus)}</span>
                {accessPlan.immutableAfterApproval && <span className="rls-immutable-badge">Immutable after approval</span>}
                {accessPlan.appendOnly && <span className="rls-append-only-badge">Append-only</span>}
              </div>
              <div className="migration-review-summary-grid">
                <span><strong>User select</strong>{decisionLabel(accessPlan.userSelect)}</span>
                <span><strong>User insert</strong>{decisionLabel(accessPlan.userInsert)}</span>
                <span><strong>User update</strong>{decisionLabel(accessPlan.userUpdate)}</span>
                <span><strong>User delete</strong>{decisionLabel(accessPlan.userDelete)}</span>
                <span><strong>Service insert</strong>{decisionLabel(accessPlan.serviceInsert)}</span>
                <span><strong>Service update</strong>{decisionLabel(accessPlan.serviceUpdate)}</span>
              </div>
              <div className="migration-draft-table-list">
                {accessPlan.notes.map((note) => <span className="rls-access-decision-badge" key={`${accessPlan.tableName}-${note}`}>{note}</span>)}
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Privacy notes and next steps</summary>
        <div className="migration-draft-warning-list">
          {reviewPlan.privacyRetentionNotes.map((note) => <span key={note}>{note}</span>)}
        </div>
        <ol className="migration-review-next-steps">
          {reviewPlan.nextSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </details>
    </InlinePlanCardShell>
  )
}

