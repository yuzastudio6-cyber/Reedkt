import { Badge } from '../../Badge'
import type { ProjectEditBriefAttachmentChipModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefAttachmentChipsProps = {
  attachments: ProjectEditBriefAttachmentChipModel[]
}

export function ProjectEditBriefAttachmentChips({ attachments }: ProjectEditBriefAttachmentChipsProps) {
  if (!attachments.length) {
    return <p className="project-edit-brief-muted">No marker attachments. Add metadata-only attachments from the marker drawer.</p>
  }

  return (
    <div className="project-edit-brief-attachment-chips" data-testid="project-edit-brief-attachment-chips">
      {attachments.map((attachment) => (
        <span className="project-edit-brief-attachment-chip" data-testid={`project-edit-brief-readonly-attachment-chip-${attachment.id}`} key={attachment.id}>
          <strong>{attachment.label}</strong>
          <Badge>{attachment.kindLabel}</Badge>
          <Badge accent="cyan">{attachment.statusLabel}</Badge>
          <small>{attachment.previewLabel ?? attachment.noteLabel}</small>
        </span>
      ))}
    </div>
  )
}
