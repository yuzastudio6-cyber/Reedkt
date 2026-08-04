import type {
  EditCue,
  EditCueConflictRecord,
  EditCueConflictResolutionType,
} from '../../../types'
import { EditCueConflictCard } from './EditCueConflictCard'

type EditCueConflictListProps = {
  conflicts: EditCueConflictRecord[]
  cues: EditCue[]
  onResolveConflict?: (conflictId: string, resolutionType: EditCueConflictResolutionType, options?: { editCueId?: string; patch?: Record<string, unknown> }) => void
  onIgnoreConflict?: (conflictId: string) => void
  onResetConflict?: (conflictId: string) => void
}

const severityOrder = {
  blocking: 0,
  warning: 1,
  info: 2,
} satisfies Record<EditCueConflictRecord['severity'], number>

export function EditCueConflictList({
  conflicts,
  cues,
  onIgnoreConflict,
  onResetConflict,
  onResolveConflict,
}: EditCueConflictListProps) {
  if (conflicts.length === 0) {
    return (
      <section className="inline-chat-card edit-cue-conflict-list">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Cue conflicts</span>
            <h3>No cue conflicts found.</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="inline-chat-card edit-cue-conflict-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Cue conflicts</span>
          <h3>Review cue reliability before planning</h3>
        </div>
      </div>

      <div className="edit-cue-conflict-stack">
        {[...conflicts]
          .sort((first, second) => severityOrder[first.severity] - severityOrder[second.severity])
          .map((conflict) => (
            <EditCueConflictCard
              conflict={conflict}
              key={conflict.id}
              onIgnoreConflict={onIgnoreConflict}
              onResetConflict={onResetConflict}
              onResolveConflict={onResolveConflict}
              relatedCues={cues.filter((cue) => conflict.editCueIds.includes(cue.id))}
            />
          ))}
      </div>
    </section>
  )
}
