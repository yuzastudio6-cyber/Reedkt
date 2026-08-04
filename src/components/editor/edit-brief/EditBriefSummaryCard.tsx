import type {
  EditBrief,
  EditBriefReadinessCheck,
  EditBriefSummary,
} from '../../../types'

type EditBriefSummaryCardProps = {
  editBrief: EditBrief
  summary?: EditBriefSummary | null
  readiness?: EditBriefReadinessCheck | null
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatDuration(ms?: number) {
  if (!ms) return 'AI decides'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

function statusTone(status: EditBrief['status']) {
  if (status === 'ready' || status === 'used_in_plan') return 'success'
  if (status === 'superseded') return 'attention'
  return 'neutral'
}

export function EditBriefSummaryCard({
  editBrief,
  readiness,
  summary,
}: EditBriefSummaryCardProps) {
  const missingFields = readiness?.missingRecommendedFields ?? []

  return (
    <section className="edit-brief-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit Brief</span>
          <h3>{summary?.title ?? 'Edit Brief'}</h3>
        </div>
        <span className={`edit-brief-status edit-brief-status-${statusTone(editBrief.status)}`}>
          <span aria-hidden="true" />
          {formatLabel(editBrief.status)}
        </span>
      </div>

      <p className="inline-helper">
        {readiness?.ready
          ? 'Ready to include as structured direction in the next edit plan.'
          : 'Optional: add a goal and keep at least one platform selected if you want this brief used as structured direction.'}
      </p>

      <div className="edit-brief-summary-grid">
        <span>
          <strong>Goal</strong>
          {editBrief.goal?.trim() || 'Not set'}
        </span>
        <span>
          <strong>Platforms</strong>
          {editBrief.targetPlatforms.map(formatLabel).join(', ') || 'AI decides'}
        </span>
        <span>
          <strong>Duration</strong>
          {formatDuration(editBrief.targetDurationMs)}
        </span>
        <span>
          <strong>Style</strong>
          {editBrief.styleKeywords.join(', ') || 'AI decides'}
        </span>
      </div>

      {missingFields.length > 0 && (
        <p className="inline-helper">
          Helpful if you want a stronger brief: {missingFields.join(', ')}.
        </p>
      )}
    </section>
  )
}
