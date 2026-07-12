import { Card } from '../../Card'
import { Button } from '../../Button'
import type { ProjectEditBriefWorkspaceModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefEmptyStateProps = {
  emptyState: NonNullable<ProjectEditBriefWorkspaceModel['emptyState']>
  onOpenBrief?: () => void
}

export function ProjectEditBriefEmptyState({ emptyState, onOpenBrief }: ProjectEditBriefEmptyStateProps) {
  return (
    <Card className="project-edit-brief-empty-state" data-testid="project-edit-brief-empty-state">
      <span className="section-eyebrow">Mock Brief state</span>
      <h3>{emptyState.title}</h3>
      <p>{emptyState.body}</p>
      <p>Add Marker requires an active mock Brief. Marker Chat, metadata attachments, and QA also become available only after a mock Brief exists. The explicit action below creates or opens mock/local Brief metadata only; it never starts planner application, render, workers, or credits.</p>
      {(emptyState.kind === 'not_opened' || emptyState.kind === 'not_found') && onOpenBrief ? (
        <Button data-testid="project-edit-brief-open-button" onClick={onOpenBrief} size="sm" type="button" variant="primary">
          Open Edit Brief
        </Button>
      ) : null}
    </Card>
  )
}
