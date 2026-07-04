import { Archive, CheckCircle2, Save, X } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefMarkerActionBarProps = {
  busy?: boolean
  canArchive: boolean
  canConfirm: boolean
  canSave: boolean
  mode: 'create' | 'edit'
  onArchive: () => void
  onCancel: () => void
  onConfirm: () => void
  onSave: () => void
}

export function ProjectEditBriefMarkerActionBar({
  busy = false,
  canArchive,
  canConfirm,
  canSave,
  mode,
  onArchive,
  onCancel,
  onConfirm,
  onSave,
}: ProjectEditBriefMarkerActionBarProps) {
  return (
    <div className="project-edit-brief-marker-action-bar" data-testid="project-edit-brief-marker-action-bar">
      <Button data-testid="project-edit-brief-marker-save-button" disabled={busy || !canSave} icon={Save} onClick={onSave} size="sm" variant="primary">
        {mode === 'create' ? 'Save marker' : 'Save update'}
      </Button>
      {mode === 'edit' ? (
        <>
          <Button data-testid="project-edit-brief-marker-confirm-button" disabled={busy || !canConfirm} icon={CheckCircle2} onClick={onConfirm} size="sm" variant="secondary">
            Confirm marker
          </Button>
          <Button data-testid="project-edit-brief-marker-archive-button" disabled={busy || !canArchive} icon={Archive} onClick={onArchive} size="sm" variant="danger">
            Archive
          </Button>
        </>
      ) : null}
      <Button data-testid="project-edit-brief-marker-cancel-button" disabled={busy} icon={X} onClick={onCancel} size="sm" variant="ghost">
        Cancel
      </Button>
    </div>
  )
}
