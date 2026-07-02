import type { EditLevelMarkerContextPolicyModel } from '../../types'

type EditLevelMarkerContextPolicyCardProps = {
  policy: EditLevelMarkerContextPolicyModel
  compact?: boolean
}

export function EditLevelMarkerContextPolicyCard({
  compact = false,
  policy,
}: EditLevelMarkerContextPolicyCardProps) {
  return (
    <section
      className={`edit-level-marker-context-policy ${compact ? 'is-compact' : ''}`.trim()}
      data-testid="edit-level-marker-context-policy"
    >
      <span className="section-eyebrow">Marker context policy</span>
      <h3>{policy.displayName} marker window</h3>
      <div className="edit-level-source-grid">
        <span><strong>{policy.windowLabel}</strong><small>Marker window</small></span>
        <span><strong>{policy.transcriptPolicy}</strong><small>Transcript</small></span>
        <span><strong>{policy.visualPolicy}</strong><small>Visual</small></span>
        <span><strong>{policy.audioPolicy}</strong><small>Audio</small></span>
        <span><strong>{policy.graphicTextPolicy}</strong><small>Graphic/text</small></span>
        <span><strong>{policy.includesQAWarnings ? 'QA warnings included' : 'QA warnings minimal'}</strong><small>QA</small></span>
      </div>
      {!compact && <p className="inline-helper">{policy.summary}</p>}
    </section>
  )
}
