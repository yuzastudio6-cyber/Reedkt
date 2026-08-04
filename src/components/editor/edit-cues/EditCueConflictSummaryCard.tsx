import { RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '../../Button'
import type { EditCueConflictSummary } from '../../../types'

type EditCueConflictSummaryCardProps = {
  summary: EditCueConflictSummary
  onRemapAllCues?: () => void
  onResetAllConflicts?: () => void
}

const summaryItems = [
  ['totalConflicts', 'Total conflicts'],
  ['openConflicts', 'Open'],
  ['blockingConflicts', 'Blocking'],
  ['warningConflicts', 'Warnings'],
  ['remapPendingCount', 'Remap pending'],
  ['removedSourceCueCount', 'Removed-source cues'],
] as const

export function EditCueConflictSummaryCard({
  onRemapAllCues,
  onResetAllConflicts,
  summary,
}: EditCueConflictSummaryCardProps) {
  return (
    <section className="inline-chat-card edit-cue-conflict-summary">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cue reliability</span>
          <h3>Remap and resolve cue conflicts</h3>
        </div>
      </div>

      <p className="inline-helper">Resolve cue conflicts before planning for the cleanest result.</p>

      <div className="edit-cue-conflict-summary-grid">
        {summaryItems.map(([key, label]) => (
          <span key={key}>
            <strong>{summary[key]}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>

      <div className="edit-cue-conflict-actions">
        <Button icon={RefreshCw} onClick={onRemapAllCues} variant="secondary">
          Remap All Cues
        </Button>
        <Button
          disabled={summary.resolvedConflicts === 0 && summary.ignoredConflicts === 0}
          icon={RotateCcw}
          onClick={onResetAllConflicts}
          variant="ghost"
        >
          Reset Conflict Resolutions
        </Button>
      </div>
    </section>
  )
}
