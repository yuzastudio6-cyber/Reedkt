import type { SupabaseProductionReadinessCheck } from '../../types/supabase-production-readiness'
import type { EditPlan } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSupabaseProductionReadinessCardProps = {
  plan: EditPlan
}

const severityRank: Record<SupabaseProductionReadinessCheck['severity'], number> = {
  blocking: 0,
  error: 1,
  warning: 2,
  info: 3,
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

export function InlineSupabaseProductionReadinessCard({ plan }: InlineSupabaseProductionReadinessCardProps) {
  const readinessPlan = plan.supabaseProductionReadinessPlan

  if (!readinessPlan) {
    return null
  }

  const checksByPriority = [...readinessPlan.checks].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
  const rlsIncluded = readinessPlan.activeMigrationFiles.some((file) => file.includes('rls_policies'))
  const storageIncluded = readinessPlan.activeMigrationFiles.some((file) => file.includes('storage_buckets_policies'))
  const approvedSnapshotImmutable = readinessPlan.checks.some((check) => check.id === 'supabase-readiness-approved-snapshot-immutability' && check.passed)

  return (
    <InlinePlanCardShell
      className="supabase-production-readiness-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{statusLabel(readinessPlan.status)}</span>
          <span className="compact-summary-chip">{readinessPlan.activeMigrationFiles.length} migrations</span>
          <span className="compact-summary-chip">{readinessPlan.manualTestFiles.length} manual tests</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Data bridge"
      helper="Active migration files are prepared for local/staging testing. Codex did not run SQL or connect to Supabase."
      priority="developer_detail"
      status={readinessPlan.status === 'production_blocked' ? 'blocking' : 'warning'}
      title="Supabase production-test readiness"
    >
      <div className="qa-badge-row">
        <Badge accent="blue">Active migrations ready</Badge>
        <Badge accent="violet">No SQL run</Badge>
        <Badge accent="violet">No Supabase connection</Badge>
        <Badge accent={rlsIncluded ? 'success' : 'warning'}>RLS included</Badge>
        <Badge accent={storageIncluded ? 'success' : 'warning'}>Storage private</Badge>
        <Badge accent={approvedSnapshotImmutable ? 'success' : 'warning'}>Approved snapshots immutable</Badge>
        <Badge accent="warning">Local testing required</Badge>
        <Badge accent="warning">Staging testing required</Badge>
        <Badge accent="warning">Production blocked until approval</Badge>
      </div>

      <p className="inline-helper">{readinessPlan.summary}</p>

      <div className="supabase-readiness-summary-grid">
        <span><strong>Status</strong>{statusLabel(readinessPlan.status)}</span>
        <span><strong>Migration files</strong>{readinessPlan.activeMigrationFiles.length}</span>
        <span><strong>Manual tests</strong>{readinessPlan.manualTestFiles.length}</span>
        <span><strong>Blockers</strong>{readinessPlan.productionBlockers.length}</span>
      </div>

      <div className="supabase-no-sql-note">
        {readinessPlan.limitations.join(' ')}
      </div>

      <details className="compact-card-details">
        <summary>Active migration files</summary>
        <div className="supabase-migration-file-list">
          {readinessPlan.activeMigrationFiles.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Manual SQL test files</summary>
        <div className="supabase-test-file-list">
          {readinessPlan.manualTestFiles.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Readiness checks</summary>
        <div className="supabase-readiness-check-list">
          {checksByPriority.map((check) => (
            <article className={`supabase-readiness-check-item supabase-readiness-${check.severity}`} key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <span className="supabase-readiness-status-badge">{check.passed ? 'Passed' : 'Needs work'} / {check.severity}</span>
              </div>
              <p>{check.message}</p>
              <small>{check.recommendation}</small>
            </article>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Local testing steps</summary>
        <ol className="supabase-local-steps">
          {readinessPlan.localTestingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>

      <details className="compact-card-details">
        <summary>Staging testing steps</summary>
        <ol className="supabase-staging-steps">
          {readinessPlan.stagingTestingSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>

      <details className="compact-card-details">
        <summary>Production blockers</summary>
        <ul className="supabase-production-blocker-list">
          {readinessPlan.productionBlockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      </details>

      <div className="supabase-local-testing-required-badge">Local/staging tests and advisor checks are required before production.</div>
      <div className="supabase-production-blocked-badge">{readinessPlan.nextSteps.join(' ')}</div>
    </InlinePlanCardShell>
  )
}
