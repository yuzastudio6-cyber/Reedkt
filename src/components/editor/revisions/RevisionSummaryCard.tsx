import { Badge } from '../../Badge'
import type { RevisionWorkflowState } from '../../../types'

type RevisionSummaryCardProps = {
  state: RevisionWorkflowState | null
}

export function RevisionSummaryCard({ state }: RevisionSummaryCardProps) {
  const summary = state?.summary

  return (
    <section className="inline-chat-card revision-summary-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Revision workflow</span>
          <h3>Local revision status</h3>
        </div>
        <Badge accent={summary?.pendingRevisions ? 'warning' : 'success'}>
          {summary?.pendingRevisions ?? 0} pending
        </Badge>
      </div>
      <div className="revision-stat-grid">
        <span>
          <strong>{summary?.totalRevisions ?? 0}</strong>
          <small>Total revisions</small>
        </span>
        <span>
          <strong>{summary?.completedRevisions ?? 0}</strong>
          <small>Completed</small>
        </span>
        <span>
          <strong>{summary?.failedRevisions ?? 0}</strong>
          <small>Failed</small>
        </span>
        <span>
          <strong>{summary?.mockCreditsEstimated ?? 0}</strong>
          <small>Credits estimated</small>
        </span>
        <span>
          <strong>{state?.latestPreviewVersion ?? 1}</strong>
          <small>Latest preview version</small>
        </span>
        <span>
          <strong>{state?.latestEditVersion ?? 1}</strong>
          <small>Latest Edit Map version</small>
        </span>
      </div>
    </section>
  )
}
