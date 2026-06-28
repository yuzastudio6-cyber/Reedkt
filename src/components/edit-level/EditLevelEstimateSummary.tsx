import type { EditLevelEstimateSummaryModel } from '../../types'

type EditLevelEstimateSummaryProps = {
  summary: EditLevelEstimateSummaryModel
  compact?: boolean
}

export function EditLevelEstimateSummary({
  compact = false,
  summary,
}: EditLevelEstimateSummaryProps) {
  return (
    <section
      className={`edit-level-estimate-summary ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-estimate-summary"
    >
      <span className="section-eyebrow">Estimate policy</span>
      <h3>{summary.displayName} estimate policy</h3>
      <div className="edit-level-estimate-grid">
        <span><strong>{summary.estimateStatusLabel}</strong><small>Estimate status</small></span>
        <span><strong>{summary.timeEstimateSummary}</strong><small>Time estimate</small></span>
        <span><strong>{summary.creditEstimateMultiplier}</strong><small>Credit multiplier placeholder</small></span>
        <span><strong>{summary.analysisPassBudget}</strong><small>Analysis budget</small></span>
        <span><strong>{summary.qwenReasoningPassBudget}</strong><small>Qwen planning policy</small></span>
        <span><strong>{summary.renderPassBudgetFuture}</strong><small>Future render pass budget</small></span>
        <span><strong>{summary.revisionBudgetFuture}</strong><small>Future revision budget</small></span>
        <span><strong>{summary.variantBudgetFuture}</strong><small>Future variant budget</small></span>
      </div>
      {!compact && (
        <ul>
          {summary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
      <p className="inline-helper">{summary.userFacingSummary}</p>
    </section>
  )
}
