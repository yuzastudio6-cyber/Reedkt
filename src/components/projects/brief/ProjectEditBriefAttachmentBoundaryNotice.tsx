import { Badge } from '../../Badge'

type ProjectEditBriefAttachmentBoundaryNoticeProps = {
  summary: string
}

export function ProjectEditBriefAttachmentBoundaryNotice({ summary }: ProjectEditBriefAttachmentBoundaryNoticeProps) {
  return (
    <div className="project-edit-brief-attachment-boundary" data-testid="project-edit-brief-attachment-boundary">
      <Badge accent="cyan">Metadata only</Badge>
      <p>{summary}</p>
    </div>
  )
}
