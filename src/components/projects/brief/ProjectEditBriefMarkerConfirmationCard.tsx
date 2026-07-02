import { Badge } from '../../Badge'
import type { ProjectEditBriefMarkerConfirmationRecord } from '../../../types/project-edit-brief'

type ProjectEditBriefMarkerConfirmationCardProps = {
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
}

export function ProjectEditBriefMarkerConfirmationCard({ confirmations }: ProjectEditBriefMarkerConfirmationCardProps) {
  const latest = confirmations.at(-1)
  return (
    <div className="project-edit-brief-marker-chat-confirmation" data-testid="project-edit-brief-marker-chat-confirmation">
      <div className="project-edit-brief-marker-chat-card-header">
        <h4>Confirmation</h4>
        <Badge>{confirmations.length} saved</Badge>
      </div>
      {latest ? (
        <p>{latest.summary}</p>
      ) : (
        <p>Confirm-only mode will save a marker-scoped confirmation when intent is clear.</p>
      )}
    </div>
  )
}
