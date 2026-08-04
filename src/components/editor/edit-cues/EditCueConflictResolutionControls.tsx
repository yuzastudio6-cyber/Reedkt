import { CheckCircle2, RotateCcw, Sparkles, Trash2, XCircle } from 'lucide-react'
import { Button } from '../../Button'
import type {
  EditCue,
  EditCueConflictRecord,
  EditCueConflictResolutionType,
} from '../../../types'

type EditCueConflictResolutionControlsProps = {
  conflict: EditCueConflictRecord
  relatedCues: EditCue[]
  onResolveConflict?: (conflictId: string, resolutionType: EditCueConflictResolutionType, options?: { editCueId?: string; patch?: Record<string, unknown> }) => void
  onIgnoreConflict?: (conflictId: string) => void
  onResetConflict?: (conflictId: string) => void
}

export function EditCueConflictResolutionControls({
  conflict,
  onIgnoreConflict,
  onResetConflict,
  onResolveConflict,
  relatedCues,
}: EditCueConflictResolutionControlsProps) {
  const resolved = conflict.status !== 'open'

  return (
    <div className="edit-cue-conflict-controls">
      <Button disabled={resolved} icon={Sparkles} onClick={() => onResolveConflict?.(conflict.id, 'let_ai_decide')} size="sm" variant="secondary">
        Let AI decide
      </Button>
      <Button disabled={resolved} icon={CheckCircle2} onClick={() => onResolveConflict?.(conflict.id, 'make_optional')} size="sm" variant="ghost">
        Make optional
      </Button>
      {relatedCues.length >= 2 && (
        <>
          <Button disabled={resolved} onClick={() => onResolveConflict?.(conflict.id, 'use_first')} size="sm" variant="ghost">
            Use first
          </Button>
          <Button disabled={resolved} onClick={() => onResolveConflict?.(conflict.id, 'use_second')} size="sm" variant="ghost">
            Use second
          </Button>
        </>
      )}
      {relatedCues.map((cue) => (
        <Button
          disabled={resolved}
          icon={Trash2}
          key={cue.id}
          onClick={() => onResolveConflict?.(conflict.id, 'delete_cue', { editCueId: cue.id })}
          size="sm"
          variant="danger"
        >
          Remove {cue.title}
        </Button>
      ))}
      <Button disabled={resolved} icon={XCircle} onClick={() => onIgnoreConflict?.(conflict.id)} size="sm" variant="ghost">
        Ignore
      </Button>
      <Button disabled={conflict.status === 'open'} icon={RotateCcw} onClick={() => onResetConflict?.(conflict.id)} size="sm" variant="ghost">
        Reset
      </Button>
    </div>
  )
}
