import { Badge } from '../../Badge'
import type { ProjectEditBriefMarkerConflictRecord } from '../../../types/project-edit-brief'
import { ProjectEditBriefQABadge } from './ProjectEditBriefQABadge'

type ProjectEditBriefConflictCardProps = {
  conflict: ProjectEditBriefMarkerConflictRecord
}

export function ProjectEditBriefConflictCard({ conflict }: ProjectEditBriefConflictCardProps) {
  return (
    <article className="project-edit-brief-conflict-card" data-testid={`project-edit-brief-conflict-card-${conflict.id}`}>
      <div className="project-edit-brief-conflict-card__header">
        <strong>{conflict.title}</strong>
        <ProjectEditBriefQABadge status={conflict.qaStatus} />
      </div>
      <p>{conflict.summary}</p>
      <p className="project-edit-brief-muted">{conflict.recommendedResolution}</p>
      <div className="project-edit-brief-conflict-card__badges">
        {conflict.blocksPlan ? <Badge accent="danger">Blocks future plan</Badge> : <Badge accent="warning">Review before plan</Badge>}
        {conflict.requiresUserReview ? <Badge accent="warning">User review</Badge> : null}
      </div>
    </article>
  )
}
