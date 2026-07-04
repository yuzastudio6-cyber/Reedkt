import { CheckCircle2, GitCommit, History, PlaySquare, XCircle } from 'lucide-react'
import { Button } from '../Button'

type ProjectEditSessionHistoryActionsProps = {
  busy?: boolean
  onApproveVersion: () => void
  onCreatePreview: () => void
  onRejectVersion: () => void
  onSaveCheckpoint: () => void
  onSaveVersion: () => void
}

export function ProjectEditSessionHistoryActions({
  busy = false,
  onApproveVersion,
  onCreatePreview,
  onRejectVersion,
  onSaveCheckpoint,
  onSaveVersion,
}: ProjectEditSessionHistoryActionsProps) {
  return (
    <div className="project-edit-session-history-actions" data-testid="edit-session-history-actions">
      <Button disabled={busy} icon={GitCommit} onClick={onSaveVersion} size="sm" variant="secondary">
        Save mock version
      </Button>
      <Button disabled={busy} icon={PlaySquare} onClick={onCreatePreview} size="sm" variant="secondary">
        Create preview placeholder
      </Button>
      <Button disabled={busy} icon={History} onClick={onSaveCheckpoint} size="sm" variant="ghost">
        Add checkpoint
      </Button>
      <Button disabled={busy} icon={CheckCircle2} onClick={onApproveVersion} size="sm" variant="secondary">
        Approve mock version
      </Button>
      <Button disabled={busy} icon={XCircle} onClick={onRejectVersion} size="sm" variant="ghost">
        Reject mock version
      </Button>
    </div>
  )
}
