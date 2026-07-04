import type { ProjectEditBriefMarkerConflictRecord } from '../../../types/project-edit-brief'
import { ProjectEditBriefConflictCard } from './ProjectEditBriefConflictCard'

type ProjectEditBriefConflictListProps = {
  conflicts: ProjectEditBriefMarkerConflictRecord[]
}

export function ProjectEditBriefConflictList({ conflicts }: ProjectEditBriefConflictListProps) {
  if (!conflicts.length) {
    return (
      <div className="project-edit-brief-conflict-list" data-testid="project-edit-brief-conflict-list">
        <p className="project-edit-brief-muted">No saved mock conflicts for this marker.</p>
      </div>
    )
  }

  return (
    <div className="project-edit-brief-conflict-list" data-testid="project-edit-brief-conflict-list">
      {conflicts.map((conflict) => <ProjectEditBriefConflictCard conflict={conflict} key={conflict.id} />)}
    </div>
  )
}
