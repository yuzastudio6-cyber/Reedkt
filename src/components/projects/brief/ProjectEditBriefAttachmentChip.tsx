import { Paperclip } from 'lucide-react'
import { Badge } from '../../Badge'
import type { ProjectEditBriefAttachmentChipModel } from '../../../types/project-edit-brief-attachments'

type ProjectEditBriefAttachmentChipProps = {
  attachment: ProjectEditBriefAttachmentChipModel
  isSelected?: boolean
  onSelect?: (attachmentId: string) => void
}

export function ProjectEditBriefAttachmentChip({
  attachment,
  isSelected = false,
  onSelect,
}: ProjectEditBriefAttachmentChipProps) {
  return (
    <button
      className={`project-edit-brief-attachment-chip-button ${isSelected ? 'is-selected' : ''}`.trim()}
      data-testid={`project-edit-brief-attachment-chip-${attachment.id}`}
      onClick={() => onSelect?.(attachment.id)}
      type="button"
    >
      <Paperclip aria-hidden="true" size={16} />
      <span>
        <strong>{attachment.label}</strong>
        <small>{attachment.referenceUrlLabel ?? attachment.previewLabel ?? 'Metadata-only attachment'}</small>
      </span>
      <Badge>{attachment.kindLabel}</Badge>
      <Badge accent="cyan">{attachment.statusLabel}</Badge>
    </button>
  )
}
