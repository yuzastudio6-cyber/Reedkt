import type { EditLevelSourceUnderstandingSummaryModel } from '../../types'

type EditLevelSourceUnderstandingSummaryProps = {
  summary: EditLevelSourceUnderstandingSummaryModel
  compact?: boolean
}

export function EditLevelSourceUnderstandingSummary({
  compact = false,
  summary,
}: EditLevelSourceUnderstandingSummaryProps) {
  return (
    <section
      className={`edit-level-source-understanding-summary ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-source-understanding-summary"
    >
      <span className="section-eyebrow">Source understanding depth</span>
      <h3>{summary.headline}</h3>
      <div className="edit-level-source-grid">
        <span><strong>{summary.depthLabel}</strong><small>Source pass</small></span>
        <span><strong>{summary.transcriptPolicy}</strong><small>Transcript policy</small></span>
        <span><strong>{summary.visualPolicy}</strong><small>Visual policy</small></span>
        <span><strong>{summary.audioPolicy}</strong><small>Audio policy</small></span>
        <span><strong>{summary.graphicTextPolicy}</strong><small>Graphic/text policy</small></span>
        <span><strong>{summary.markerContextWindow}</strong><small>Marker context window</small></span>
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
