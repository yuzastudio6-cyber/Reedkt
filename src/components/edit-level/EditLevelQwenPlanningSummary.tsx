import type { EditLevelQwenPlanningSummaryModel } from '../../types'

type EditLevelQwenPlanningSummaryProps = {
  summary: EditLevelQwenPlanningSummaryModel
  compact?: boolean
}

export function EditLevelQwenPlanningSummary({
  compact = false,
  summary,
}: EditLevelQwenPlanningSummaryProps) {
  return (
    <section
      className={`edit-level-qwen-planning-summary ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-qwen-planning-summary"
    >
      <span className="section-eyebrow">Qwen planning profile</span>
      <h3>{summary.displayName} Qwen planning depth</h3>
      <div className="edit-level-qwen-grid">
        <span><strong>{summary.qwenReasoningDepth}</strong><small>Reasoning depth</small></span>
        <span><strong>{summary.planningPassPolicy}</strong><small>Planning pass policy</small></span>
        <span><strong>{summary.promptContextPolicy}</strong><small>Prompt context</small></span>
        <span><strong>{summary.markerChatPolicy}</strong><small>Marker Chat behavior</small></span>
        <span><strong>{summary.preferenceDNAPolicy}</strong><small>Preference DNA</small></span>
        <span><strong>{summary.qaExplanationPolicy}</strong><small>QA explanation</small></span>
      </div>
      {!compact && (
        <ul>
          {summary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
      <p className="inline-helper">{summary.structuredOutputPolicy}</p>
    </section>
  )
}
