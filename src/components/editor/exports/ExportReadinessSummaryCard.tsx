import { Badge } from '../../Badge'
import type { ExportWorkflowState } from '../../../types'

type ExportReadinessSummaryCardProps = {
  state: ExportWorkflowState
}

function statusLabel(status: ExportWorkflowState['status']) {
  return status.replace(/_/g, ' ')
}

export function ExportReadinessSummaryCard({ state }: ExportReadinessSummaryCardProps) {
  const accent = state.status === 'blocked' || state.status === 'failed'
    ? 'danger'
    : state.status === 'export_ready' || state.status === 'approved' || state.status === 'ready'
      ? 'success'
      : 'warning'

  return (
    <section className={`inline-chat-card export-readiness-summary export-status--${state.status}`}>
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export readiness</span>
          <h3>{statusLabel(state.status)}</h3>
        </div>
        <Badge accent={accent}>{state.summary.enabledTargetCount} targets</Badge>
      </div>
      <div className="export-stat-grid">
        <span>
          <strong>v{state.sourcePreviewVersion ?? 1}</strong>
          <small>Preview version</small>
        </span>
        <span>
          <strong>v{state.sourceEditVersion ?? 1}</strong>
          <small>Edit Map version</small>
        </span>
        <span>
          <strong>{state.summary.outputCount}</strong>
          <small>Private output records</small>
        </span>
        <span>
          <strong>{state.summary.blockingIssueCount}</strong>
          <small>Blocking issues</small>
        </span>
        <span>
          <strong>{state.summary.warningIssueCount}</strong>
          <small>Warnings</small>
        </span>
        <span>
          <strong>{state.summary.totalMockCreditsEstimated}</strong>
          <small>Estimated credits</small>
        </span>
      </div>
      <div className="export-next-actions">
        {state.nextRecommendedActions.map((action) => <span key={action}>{action}</span>)}
      </div>
    </section>
  )
}
