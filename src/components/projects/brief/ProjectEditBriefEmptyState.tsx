import { Card } from '../../Card'
import type { ProjectEditBriefWorkspaceModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefEmptyStateProps = {
  emptyState: NonNullable<ProjectEditBriefWorkspaceModel['emptyState']>
}

export function ProjectEditBriefEmptyState({ emptyState }: ProjectEditBriefEmptyStateProps) {
  return (
    <Card className="project-edit-brief-empty-state" data-testid="project-edit-brief-empty-state">
      <span className="section-eyebrow">Mock Brief state</span>
      <h3>{emptyState.title}</h3>
      <p>{emptyState.body}</p>
      <p>Add Marker requires an active mock Brief. Marker Chat, metadata attachments, and QA also become available only after a mock Brief exists; opening this empty state creates no records and never starts planner application, render, workers, or credits.</p>
    </Card>
  )
}
