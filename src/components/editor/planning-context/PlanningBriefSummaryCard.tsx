import { Badge } from '../../Badge'
import type { PlanningBriefInput } from '../../../types'

type PlanningBriefSummaryCardProps = {
  brief?: PlanningBriefInput
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatDuration(durationMs?: number) {
  if (!durationMs) return 'AI decides'
  const totalSeconds = Math.round(durationMs / 1000)
  return `${totalSeconds}s`
}

export function PlanningBriefSummaryCard({ brief }: PlanningBriefSummaryCardProps) {
  if (!brief) {
    return (
      <section className="inline-chat-card planning-brief-summary">
        <div className="inline-card-heading">
          <div>
          <span className="section-eyebrow">Edit Brief direction</span>
          <h3>No Edit Brief added</h3>
        </div>
        <Badge accent="muted">Optional</Badge>
      </div>
      <p className="inline-helper">ReeditPro can create the edit plan from the prompt and source context. Add a brief only when you want more structured control.</p>
    </section>
  )
}

  return (
    <section className="inline-chat-card planning-brief-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit Brief direction</span>
          <h3>{brief.goal || 'Creative direction captured'}</h3>
        </div>
        <Badge accent={brief.ready ? 'success' : 'muted'}>{brief.ready ? 'Ready' : 'Draft'}</Badge>
      </div>

      {brief.audience && <p className="inline-helper">Audience: {brief.audience}</p>}

      <div className="planning-context-stat-grid">
        <span><strong>{brief.targetPlatforms.map(formatLabel).join(', ') || 'AI decides'}</strong><small>Platforms</small></span>
        <span><strong>{formatDuration(brief.targetDurationMs)}</strong><small>Duration</small></span>
        <span><strong>{brief.styleKeywords.join(', ') || 'AI decides'}</strong><small>Style</small></span>
        <span><strong>{formatLabel(brief.pacingPreference ?? 'ai_decides')}</strong><small>Pacing</small></span>
        <span><strong>{formatLabel(brief.captionPreference ?? 'ai_decides')}</strong><small>Captions</small></span>
        <span><strong>{formatLabel(brief.musicPreference ?? 'ai_decides')}</strong><small>Music</small></span>
      </div>

      {(brief.bRollPreference || brief.brandNotes || brief.specialInstructions) && (
        <div className="planning-brief-note-list">
          {brief.bRollPreference && <p><strong>B-roll</strong>{brief.bRollPreference}</p>}
          {brief.brandNotes && <p><strong>Brand</strong>{brief.brandNotes}</p>}
          {brief.specialInstructions && <p><strong>Special</strong>{brief.specialInstructions}</p>}
        </div>
      )}
    </section>
  )
}
