import { Trash2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { ProjectEditBriefAttachmentChipModel } from '../../../types/project-edit-brief-attachments'

type ProjectEditBriefAttachmentDetailCardProps = {
  attachment?: ProjectEditBriefAttachmentChipModel
  busy?: boolean
  onRemove?: (attachmentId: string) => void
}

export function ProjectEditBriefAttachmentDetailCard({
  attachment,
  busy = false,
  onRemove,
}: ProjectEditBriefAttachmentDetailCardProps) {
  if (!attachment) {
    return (
      <div className="project-edit-brief-attachment-detail" data-testid="project-edit-brief-attachment-detail">
        <h5>Attachment detail</h5>
        <p>Select an attachment chip to inspect metadata-only details.</p>
      </div>
    )
  }

  return (
    <div className="project-edit-brief-attachment-detail" data-testid="project-edit-brief-attachment-detail">
      <div className="project-edit-brief-attachment-detail__header">
        <div>
          <h5>{attachment.label}</h5>
          <p>{attachment.referenceUrlLabel ?? attachment.previewLabel ?? 'No media preview is generated.'}</p>
        </div>
        <Badge accent="cyan">{attachment.kindLabel}</Badge>
      </div>
      <ul className="project-edit-brief-note-list">
        {attachment.notes.map((note) => <li key={note}>{note}</li>)}
        {attachment.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
      <Button
        data-testid="project-edit-brief-attachment-remove-button"
        disabled={busy}
        icon={Trash2}
        onClick={() => onRemove?.(attachment.id)}
        size="sm"
        variant="danger"
      >
        Remove metadata
      </Button>
    </div>
  )
}
