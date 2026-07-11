import { Badge } from '../../Badge'
import type { GenerationReadinessState } from '../../../types'

type GenerationReadinessSummaryCardProps = {
  state: GenerationReadinessState
}

function statusLabel(status: GenerationReadinessState['status']) {
  if (status === 'not_ready') return 'Not ready'
  if (status === 'ready_with_warnings') return 'Ready with warnings'
  if (status === 'preview_ready') return 'Review ready'
  return status.replace(/_/g, ' ')
}

function statusAccent(status: GenerationReadinessState['status']) {
  if (status === 'preview_ready' || status === 'approved' || status === 'ready') return 'success'
  if (status === 'blocked' || status === 'failed') return 'danger'
  if (status === 'generating') return 'cyan'
  return 'warning'
}

export function GenerationReadinessSummaryCard({ state }: GenerationReadinessSummaryCardProps) {
  return (
    <section className={`inline-chat-card generation-readiness-summary generation-status--${state.status}`.trim()}>
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Review readiness</span>
          <h3>{state.summary}</h3>
        </div>
        <Badge accent={statusAccent(state.status)}>{statusLabel(state.status)}</Badge>
      </div>

      <div className="generation-readiness-stat-grid">
        <span>
          <strong>{state.canApprove ? 'Yes' : 'No'}</strong>
          <small>Can approve</small>
        </span>
        <span>
          <strong>{state.canGenerate ? 'Yes' : 'No'}</strong>
          <small>Can prepare</small>
        </span>
        <span>
          <strong>{state.canPreviewProceed ? 'Yes' : 'No'}</strong>
          <small>Review can proceed</small>
        </span>
        <span>
          <strong>{state.issues.filter((issue) => issue.severity === 'blocking').length}</strong>
          <small>Blocking issues</small>
        </span>
        <span>
          <strong>{state.issues.filter((issue) => issue.severity === 'warning').length}</strong>
          <small>Warnings</small>
        </span>
        <span>
          <strong>{state.creditEstimate?.totalCredits ?? 0}</strong>
          <small>Estimated credits</small>
        </span>
      </div>

      <div className="generation-readiness-next-actions">
        {state.nextRecommendedActions.map((action) => (
          <span key={action}>{action}</span>
        ))}
      </div>
    </section>
  )
}
