import { Badge } from '../../Badge'
import type {
  EditCue,
  EditCueConflictRecord,
  EditCueConflictResolutionType,
} from '../../../types'
import { EditCueConflictResolutionControls } from './EditCueConflictResolutionControls'

type EditCueConflictCardProps = {
  conflict: EditCueConflictRecord
  relatedCues: EditCue[]
  onResolveConflict?: (conflictId: string, resolutionType: EditCueConflictResolutionType, options?: { editCueId?: string; patch?: Record<string, unknown> }) => void
  onIgnoreConflict?: (conflictId: string) => void
  onResetConflict?: (conflictId: string) => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function severityAccent(severity: EditCueConflictRecord['severity']) {
  if (severity === 'blocking') return 'danger'
  if (severity === 'warning') return 'warning'
  return 'info'
}

function statusAccent(status: EditCueConflictRecord['status']) {
  if (status === 'resolved') return 'success'
  if (status === 'ignored') return 'muted'
  return 'warning'
}

export function EditCueConflictCard({
  conflict,
  onIgnoreConflict,
  onResetConflict,
  onResolveConflict,
  relatedCues,
}: EditCueConflictCardProps) {
  return (
    <article className={`edit-cue-conflict-card edit-cue-conflict--${conflict.severity}`}>
      <div className="edit-cue-conflict-card-header">
        <div>
          <span className="section-eyebrow">{formatLabel(conflict.kind)}</span>
          <h4>{conflict.message}</h4>
        </div>
        <div className="inline-plan-card-badges">
          <Badge accent={severityAccent(conflict.severity)}>{formatLabel(conflict.severity)}</Badge>
          <Badge accent={statusAccent(conflict.status)}>{formatLabel(conflict.status)}</Badge>
        </div>
      </div>

      {conflict.suggestedResolution && <p className="inline-helper">{conflict.suggestedResolution}</p>}

      <div className="edit-cue-conflict-related">
        {relatedCues.map((cue) => <span key={cue.id}>{cue.title}</span>)}
      </div>

      <EditCueConflictResolutionControls
        conflict={conflict}
        onIgnoreConflict={onIgnoreConflict}
        onResetConflict={onResetConflict}
        onResolveConflict={onResolveConflict}
        relatedCues={relatedCues}
      />
    </article>
  )
}
