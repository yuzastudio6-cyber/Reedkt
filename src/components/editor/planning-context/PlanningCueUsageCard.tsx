import { Badge } from '../../Badge'
import type { PlanningCueUsage } from '../../../types'

type PlanningCueUsageCardProps = {
  cueUsages: PlanningCueUsage[]
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatRange(range: PlanningCueUsage['mappedTimeRange']) {
  if (!range) return 'No mapped timing'
  const start = (range.startMs / 1000).toFixed(1)
  const end = (range.endMs / 1000).toFixed(1)
  return `${start}s-${end}s`
}

function statusAccent(status: PlanningCueUsage['status']) {
  if (status === 'will_use' || status === 'will_adjust') return 'success'
  if (status === 'blocked' || status === 'needs_review') return 'warning'
  return 'muted'
}

export function PlanningCueUsageCard({ cueUsages }: PlanningCueUsageCardProps) {
  const groupedStatuses: PlanningCueUsage['status'][] = [
    'will_use',
    'will_adjust',
    'needs_review',
    'blocked',
    'not_ready',
    'ignored',
  ]

  return (
    <section className="inline-chat-card planning-cue-usage">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit Cue usage</span>
          <h3>{cueUsages.length ? `${cueUsages.length} cue input${cueUsages.length === 1 ? '' : 's'}` : 'No Edit Cues added'}</h3>
        </div>
        <Badge accent={cueUsages.some((cue) => cue.status === 'blocked') ? 'warning' : 'muted'}>
          {cueUsages.some((cue) => cue.status === 'blocked') ? 'Review cues' : 'Optional'}
        </Badge>
      </div>

      {cueUsages.length === 0 ? (
        <p className="inline-helper">AI can continue without moment-level cue direction.</p>
      ) : (
        <div className="planning-cue-usage-list">
          {groupedStatuses.flatMap((status) =>
            cueUsages
              .filter((cue) => cue.status === status)
              .map((cue) => (
                <article className={`planning-cue-usage-item planning-cue-usage-item--${cue.status}`} key={cue.editCueId}>
                  <div>
                    <strong>{cue.title}</strong>
                    <Badge accent={statusAccent(cue.status)}>{formatLabel(cue.status)}</Badge>
                  </div>
                  <span>{formatLabel(cue.role)} / {formatLabel(cue.priority)} / {formatRange(cue.mappedTimeRange)}</span>
                  <small>{cue.explanation}</small>
                  {cue.relatedAssetIds.length > 0 && <small>{cue.relatedAssetIds.length} related asset{cue.relatedAssetIds.length === 1 ? '' : 's'}</small>}
                </article>
              )),
          )}
        </div>
      )}
    </section>
  )
}
