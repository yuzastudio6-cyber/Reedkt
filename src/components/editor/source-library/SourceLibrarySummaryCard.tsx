import { Badge } from '../../Badge'
import type {
  SourceLibraryStatus,
  SourceLibrarySummary,
} from '../../../types'

type SourceLibrarySummaryCardProps = {
  summary: SourceLibrarySummary
  status: SourceLibraryStatus
  confirmed?: boolean
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ')
}

export function SourceLibrarySummaryCard({ confirmed = false, status, summary }: SourceLibrarySummaryCardProps) {
  const stats = [
    { label: 'Total assets', value: summary.totalAssets },
    { label: 'Main footage', value: summary.mainFootageAssets },
    { label: 'B-roll', value: summary.bRollAssets },
    { label: 'Overlays', value: summary.overlayAssets },
    { label: 'Logos', value: summary.logoAssets },
    { label: 'Audio', value: summary.audioAssets },
    { label: 'Do not use', value: summary.doNotUseAssets },
    { label: 'Needs review', value: summary.needsReviewAssets },
    { label: 'Confirmed', value: summary.confirmedAssets },
    { label: 'Modified', value: summary.modifiedAssets },
  ]

  return (
    <section className="inline-chat-card source-library-summary-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source Library</span>
          <h3>Asset understanding summary</h3>
        </div>
        <Badge accent={confirmed ? 'success' : 'cyan'}>{formatStatus(status)}</Badge>
      </div>

      <p className="inline-helper">
        These roles help AI understand how to use each file in the Edit Brief, Edit Cues, and Edit Plan.
      </p>

      <div className="source-library-summary-grid">
        {stats.map((stat) => (
          <span className="source-library-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </span>
        ))}
      </div>
    </section>
  )
}
