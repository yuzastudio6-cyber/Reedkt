import { Badge } from '../../Badge'
import type { CleanupPlan, CleanupReviewCard, PrepSummary } from '../../../types'

type CleanupSummaryCardProps = {
  prepSummary: PrepSummary
  cleanupReviewCard: CleanupReviewCard
  cleanupPlan: CleanupPlan
  updatedCleanDurationMs?: number
  accepted?: boolean
  operationCount?: number
}

function formatDuration(ms?: number) {
  if (typeof ms !== 'number') return '0:00'

  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function CleanupSummaryCard({
  accepted = false,
  cleanupPlan,
  cleanupReviewCard,
  operationCount = 0,
  prepSummary,
  updatedCleanDurationMs,
}: CleanupSummaryCardProps) {
  const stats = [
    { label: 'Original', value: formatDuration(prepSummary.originalDurationMs) },
    { label: 'Clean Assembly', value: formatDuration(updatedCleanDurationMs ?? prepSummary.cleanAssemblyDurationMs ?? cleanupReviewCard.cleanDurationMs) },
    { label: 'Silence removed', value: prepSummary.removedSilenceCount },
    { label: 'Retake groups', value: prepSummary.retakeGroupCount },
    { label: 'False starts', value: prepSummary.falseStartCount },
    { label: 'Preserved moments', value: prepSummary.preservedMomentCount },
    { label: 'Quality issues', value: prepSummary.qualityIssueCount },
  ]

  return (
    <section className="inline-chat-card footage-prep-cleanup-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cleanup Summary</span>
          <h3>Building a clean assembly</h3>
        </div>
        <div className="inline-plan-card-badges">
          <Badge accent={accepted ? 'success' : 'warning'}>{accepted ? 'Clean assembly accepted' : 'Review changes pending'}</Badge>
          <Badge accent="success">{cleanupPlan.status}</Badge>
        </div>
      </div>

      <p className="inline-helper">
        The clean assembly removes obvious dead space and repeated takes while preserving the original source.
      </p>

      <div className="footage-prep-stat-grid">
        {stats.map((stat) => (
          <span className="footage-prep-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </span>
        ))}
      </div>

      <div className="footage-prep-summary-note">
        <strong>Why this matters</strong>
        <span>{cleanupPlan.summary}</span>
      </div>

      <div className="footage-prep-next-note">
        <strong>Next</strong>
        <span>{operationCount === 0 ? 'You can now let AI create the edit plan or add creative direction.' : `${operationCount} local cleanup review changes are reflected in the clean assembly preview.`}</span>
      </div>
    </section>
  )
}
