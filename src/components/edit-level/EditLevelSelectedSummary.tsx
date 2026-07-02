import { Badge } from '../Badge'
import type { EditLevelSelectedSummaryModel } from '../../lib/edit-level-ui-adapter'

type EditLevelSelectedSummaryProps = {
  summary: EditLevelSelectedSummaryModel
  compact?: boolean
}

export function EditLevelSelectedSummary({ compact = false, summary }: EditLevelSelectedSummaryProps) {
  return (
    <section className={`edit-level-selected-summary ${compact ? 'is-compact' : ''}`.trim()} data-testid="edit-level-selected-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Selected Edit Level</span>
          <h3>{summary.displayName}</h3>
        </div>
        <Badge accent="success">Mock/local selection</Badge>
      </div>
      <p>{summary.promise}</p>
      <div className="edit-level-summary-grid">
        <span><strong>{summary.editBriefGuidance}</strong><small>Edit Brief</small></span>
        <span><strong>{summary.estimateSummary}</strong><small>Estimate</small></span>
        <span><strong>{summary.qaSummary}</strong><small>QA profile</small></span>
      </div>
      <p className="inline-helper">{summary.boundarySummary}</p>
    </section>
  )
}
