import type { EditLevelToolDepthSummaryModel } from '../../lib/edit-level-ui-adapter'

type EditLevelToolDepthSummaryProps = {
  summary: EditLevelToolDepthSummaryModel
}

export function EditLevelToolDepthSummary({ summary }: EditLevelToolDepthSummaryProps) {
  return (
    <section className="edit-level-tool-depth-summary" data-testid="edit-level-tool-depth-summary">
      <span className="section-eyebrow">Planning depth</span>
      <h3>{summary.displayName} tool depth</h3>
      <div className="edit-level-depth-grid">
        <span><strong>{summary.qwenReasoningDepth}</strong><small>Qwen reasoning depth</small></span>
        <span><strong>{summary.visualUnderstandingDepth}</strong><small>Visual understanding depth</small></span>
        <span><strong>{summary.transcriptPolicy}</strong><small>Transcript policy</small></span>
        <span><strong>{summary.audioPolicy}</strong><small>Audio policy</small></span>
        <span><strong>{summary.graphicsPolicy}</strong><small>Graphics policy</small></span>
        <span><strong>{summary.qaProfile}</strong><small>QA profile</small></span>
      </div>
      <ul>
        {summary.summary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
