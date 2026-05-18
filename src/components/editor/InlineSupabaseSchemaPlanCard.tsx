import type { EditPlan } from '../../types/reeditpro'
import type { SupabaseSchemaGroup, SupabaseTableReadinessStatus } from '../../types/supabase-schema-plan'
import { Badge } from '../Badge'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSupabaseSchemaPlanCardProps = {
  plan: EditPlan
}

const groupLabels: Record<SupabaseSchemaGroup, string> = {
  audit_compliance: 'Audit and compliance',
  credit_approval: 'Credit and approval',
  generation_assets: 'Generation and assets',
  identity_workspace: 'Identity and workspace',
  intent_settings: 'Intent and settings',
  jobs_workers: 'Jobs and workers',
  media_source: 'Media and source',
  plan_version: 'Plan and versioning',
  project_session_chat: 'Project, session, and chat',
  qa_revision_export: 'QA, revision, and export',
}

const readinessLabels: Record<SupabaseTableReadinessStatus, string> = {
  blocked: 'Blocked',
  needs_review: 'Needs review',
  planned: 'Planned',
  ready_for_migration: 'Ready for migration',
}

function readinessAccent(status: SupabaseTableReadinessStatus) {
  if (status === 'blocked') return 'danger'
  if (status === 'needs_review') return 'warning'
  if (status === 'ready_for_migration') return 'success'
  return 'blue'
}

function groupedTables(plan: NonNullable<EditPlan['supabaseSchemaPlan']>) {
  return plan.tables.reduce<Record<SupabaseSchemaGroup, typeof plan.tables>>((groups, tablePlan) => {
    groups[tablePlan.group] = [...(groups[tablePlan.group] ?? []), tablePlan]
    return groups
  }, {} as Record<SupabaseSchemaGroup, typeof plan.tables>)
}

export function InlineSupabaseSchemaPlanCard({ plan }: InlineSupabaseSchemaPlanCardProps) {
  const schemaPlan = plan.supabaseSchemaPlan

  if (!schemaPlan) {
    return null
  }

  const groups = groupedTables(schemaPlan)
  const approvedSnapshotPlanned = schemaPlan.tables.some((tablePlan) => tablePlan.name === 'approved_plan_snapshots')
  const allBucketsPrivate = schemaPlan.storageBuckets.every((bucket) => !bucket.isPublic)
  const rlsPlanned = schemaPlan.tables.every((tablePlan) => tablePlan.rlsPolicies.length > 0)

  return (
    <InlinePlanCardShell
      className="supabase-schema-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{schemaPlan.tables.length} tables</span>
          <span className="compact-summary-chip">{schemaPlan.storageBuckets.length} buckets</span>
          <span className="compact-summary-chip">{readinessLabels[schemaPlan.migrationReadinessStatus]}</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Data bridge"
      helper="This maps ReeditPro's approved planning system into future Supabase tables and storage buckets. No migrations are created in this demo."
      priority="developer_detail"
      status={schemaPlan.migrationReadinessStatus === 'blocked' ? 'blocking' : schemaPlan.migrationReadinessStatus === 'needs_review' ? 'warning' : 'ready'}
      title="Supabase schema bridge"
    >
      <div className="qa-badge-row">
        <Badge accent="blue">Planning only</Badge>
        <Badge accent="violet">No migrations</Badge>
        <Badge accent={approvedSnapshotPlanned ? 'success' : 'warning'}>Approved snapshot table planned</Badge>
        <Badge accent={allBucketsPrivate ? 'success' : 'warning'}>Private storage</Badge>
        <Badge accent={rlsPlanned ? 'success' : 'warning'}>RLS planned</Badge>
        <Badge accent={readinessAccent(schemaPlan.migrationReadinessStatus)}>Needs review</Badge>
      </div>

      <p className="inline-helper">{schemaPlan.summary}</p>

      <div className="schema-plan-summary-grid">
        <span><strong>Tables</strong>{schemaPlan.tables.length}</span>
        <span><strong>Storage buckets</strong>{schemaPlan.storageBuckets.length}</span>
        <span><strong>Readiness</strong>{readinessLabels[schemaPlan.migrationReadinessStatus]}</span>
        <span><strong>JSONB tables</strong>{schemaPlan.tables.filter((tablePlan) => tablePlan.jsonbFields.length > 0).length}</span>
      </div>

      <div className="schema-planning-only-note">
        No SQL, migrations, Supabase clients, backend routes, storage operations, or worker jobs are created by this plan.
      </div>

      <details className="compact-card-details">
        <summary>Required reviews and next milestones</summary>
        <div className="schema-column-summary">
          {schemaPlan.requiredReviews.map((review) => <span key={review}>{review}</span>)}
        </div>
        <div className="schema-column-summary">
          {schemaPlan.nextMigrationMilestones.map((milestone) => <span key={milestone}>{milestone}</span>)}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Table groups</summary>
        <div className="schema-group-list">
          {(Object.keys(groups) as SupabaseSchemaGroup[]).map((group) => (
            <section className="schema-group-section" key={group}>
              <h4>{groupLabels[group]}</h4>
              <div className="schema-table-list">
                {groups[group].map((tablePlan) => (
                  <article className="schema-table-item" key={tablePlan.name}>
                    <div className="schema-table-meta">
                      <strong>{tablePlan.name}</strong>
                      <span className={`schema-readiness-badge schema-readiness-${tablePlan.readinessStatus}`}>{readinessLabels[tablePlan.readinessStatus]}</span>
                    </div>
                    <p>{tablePlan.purpose}</p>
                    <div className="schema-plan-summary-grid">
                      <span><strong>Columns</strong>{tablePlan.columns.length}</span>
                      <span><strong>JSONB</strong>{tablePlan.jsonbFields.length}</span>
                      <span><strong>Indexes</strong>{tablePlan.indexes.length}</span>
                      <span><strong>RLS</strong>{tablePlan.rlsPolicies.length}</span>
                    </div>
                    {tablePlan.jsonbFields.length > 0 && (
                      <div className="schema-jsonb-field-list">
                        {tablePlan.jsonbFields.map((field) => <span key={field}>{field}</span>)}
                      </div>
                    )}
                    <div className="schema-rls-policy-list">
                      {tablePlan.rlsPolicies.slice(0, 3).map((policy) => <span key={policy.name}>{policy.ruleSummary}</span>)}
                    </div>
                    {tablePlan.relationships.length > 0 && <small>{tablePlan.relationships.join(' ')}</small>}
                    {tablePlan.migrationNotes.length > 0 && <small>{tablePlan.migrationNotes.join(' ')}</small>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </details>

      <details className="compact-card-details">
        <summary>Storage buckets</summary>
        <div className="schema-storage-bucket-list">
          {schemaPlan.storageBuckets.map((bucket) => (
            <article className="schema-storage-bucket-item" key={bucket.name}>
              <strong>{bucket.name}</strong>
              <p>{bucket.purpose}</p>
              <div className="schema-table-meta">
                <span>{bucket.isPublic ? 'Public' : 'Private'}</span>
                <span>{bucket.signedUrlRecommended ? 'Signed URLs recommended' : 'No durable signed URLs'}</span>
                <span>{bucket.workerWritable ? 'Worker writable' : 'Worker read only'}</span>
                <span>{bucket.userReadable ? 'User readable' : 'Worker mediated'}</span>
              </div>
              <small>{bucket.retentionNotes.join(' ')}</small>
              <small>{bucket.rlsNotes.join(' ')}</small>
            </article>
          ))}
        </div>
      </details>

      <div className="schema-no-migration-note">
        {schemaPlan.nonGoals.join(' ')}
      </div>
    </InlinePlanCardShell>
  )
}
