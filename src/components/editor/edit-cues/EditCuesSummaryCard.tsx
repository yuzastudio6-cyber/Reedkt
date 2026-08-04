import type { EditCuesSummary } from '../../../types'

type EditCuesSummaryCardProps = {
  summary: EditCuesSummary
}

const summaryItems = [
  ['totalCues', 'Total cues'],
  ['readyCues', 'Ready'],
  ['draftCues', 'Draft'],
  ['mustFollowCues', 'Must-follow'],
  ['bRollCues', 'B-roll'],
  ['overlayCues', 'Overlays'],
  ['audioCues', 'Audio'],
  ['globalCues', 'Global rules'],
  ['blockingIssueCount', 'Blocking issues'],
] as const

export function EditCuesSummaryCard({ summary }: EditCuesSummaryCardProps) {
  return (
    <section className="inline-chat-card edit-cues-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cue summary</span>
          <h3>Precise planning instructions</h3>
        </div>
      </div>

      <p className="inline-helper">
        Use cues when you want specific moments, assets, or rules handled a certain way.
      </p>

      <div className="edit-cues-summary-grid">
        {summaryItems.map(([key, label]) => (
          <span key={key}>
            <strong>{summary[key]}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>
    </section>
  )
}
