import type { EditLevelToolCapabilitySummaryModel } from '../../types'

type EditLevelToolCapabilitySummaryProps = {
  summary: EditLevelToolCapabilitySummaryModel
  compact?: boolean
}

export function EditLevelToolCapabilitySummary({
  compact = false,
  summary,
}: EditLevelToolCapabilitySummaryProps) {
  return (
    <section
      className={`edit-level-tool-capability-summary ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-tool-capability-summary"
    >
      <span className="section-eyebrow">Tool capability route</span>
      <h3>{summary.displayName} capability plan</h3>
      <div className="edit-level-capability-grid">
        <span><strong>{summary.reasoningDepth}</strong><small>Reasoning depth</small></span>
        <span><strong>{summary.visualUnderstandingDepth}</strong><small>Visual understanding</small></span>
        <span><strong>{summary.transcriptAudioGraphicsDepth}</strong><small>Transcript / audio / graphics</small></span>
        <span><strong>{summary.editBriefGuidance}</strong><small>Edit Brief guidance</small></span>
        <span><strong>{summary.qaStrictness}</strong><small>QA strictness</small></span>
        <span><strong>{summary.estimateOnlyNotice}</strong><small>Estimate-only notice</small></span>
      </div>
      {!compact && (
        <ul>
          {summary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
      <p className="inline-helper">{summary.futureGatedSummary}</p>
    </section>
  )
}
