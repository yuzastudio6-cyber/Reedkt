import type { EditPlan } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineMigrationDraftPlanCardProps = {
  plan: EditPlan
}

function statusLabel(status: NonNullable<EditPlan['migrationDraftPlan']>['files'][number]['status']) {
  if (status === 'draft_only') return 'Draft only'
  if (status === 'ready_for_real_migration') return 'Ready for real migration'
  return 'Needs review'
}

export function InlineMigrationDraftPlanCard({ plan }: InlineMigrationDraftPlanCardProps) {
  const draftPlan = plan.migrationDraftPlan

  if (!draftPlan) {
    return null
  }

  const approvedSnapshotCovered = draftPlan.files.some((file) => file.tablesCovered.includes('approved_plan_snapshots'))
  const rlsDraftPresent = draftPlan.files.some((file) => file.id === '007_rls_policy_drafts')
  const storageDraftPresent = draftPlan.files.some((file) => file.id === '008_storage_bucket_policy_drafts')
  const allMustNotRun = draftPlan.files.every((file) => file.mustNotRun)

  return (
    <InlinePlanCardShell
      className="migration-draft-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{draftPlan.files.length} draft files</span>
          <span className="compact-summary-chip">database/migration-drafts/</span>
          <span className="compact-summary-chip">No SQL runs</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Data bridge"
      helper="These are review-only SQL drafts for the future Supabase schema. They are not active migrations and should not be run."
      priority="developer_detail"
      status={allMustNotRun ? 'warning' : 'blocking'}
      title="SQL migration drafts"
    >
      <div className="qa-badge-row">
        <Badge accent="blue">Draft only</Badge>
        <Badge accent={allMustNotRun ? 'success' : 'danger'}>Do not run</Badge>
        <Badge accent="violet">No Supabase connection</Badge>
        <Badge accent="warning">Needs review</Badge>
        <Badge accent={approvedSnapshotCovered ? 'success' : 'warning'}>Approved snapshot covered</Badge>
        <Badge accent={rlsDraftPresent ? 'success' : 'warning'}>RLS draft</Badge>
        <Badge accent={storageDraftPresent ? 'success' : 'warning'}>Storage draft</Badge>
      </div>

      <p className="inline-helper">{draftPlan.summary}</p>

      <div className="migration-draft-summary-grid">
        <span><strong>Draft files</strong>{draftPlan.files.length}</span>
        <span><strong>Must not run</strong>{draftPlan.files.filter((file) => file.mustNotRun).length}</span>
        <span><strong>Review status</strong>{draftPlan.files.filter((file) => file.status === 'needs_review').length}</span>
        <span><strong>Covered tables</strong>{new Set(draftPlan.files.flatMap((file) => file.tablesCovered)).size}</span>
      </div>

      <div className="migration-draft-no-supabase-note">
        No SQL is executed, no Supabase client is created, and no file in this draft registry points at `supabase/migrations/`.
      </div>

      <details className="compact-card-details">
        <summary>Warnings and next steps</summary>
        <ul className="migration-draft-warning-list">
          {draftPlan.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
        <ol className="migration-draft-next-steps">
          {draftPlan.nextSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </details>

      <details className="compact-card-details">
        <summary>Draft files</summary>
        <div className="migration-draft-file-list">
          {draftPlan.files.map((file) => (
            <article className="migration-draft-file-item" key={file.id}>
              <div className="migration-draft-meta">
                <strong>{file.fileName}</strong>
                <span className="migration-draft-status-badge">{statusLabel(file.status)}</span>
                {file.mustNotRun && <span className="migration-draft-do-not-run-badge">Do not run</span>}
              </div>
              <p>{file.purpose}</p>
              <small>{file.path}</small>
              <div className="migration-draft-table-list">
                {file.tablesCovered.map((table) => <span key={`${file.id}-${table}`}>{table}</span>)}
              </div>
              <ul className="migration-draft-checklist">
                {file.reviewChecklist.map((item) => <li key={`${file.id}-${item}`}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}

