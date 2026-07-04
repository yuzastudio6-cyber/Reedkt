import { Badge } from '../../Badge'
import type { ProjectEditBriefPlanPanelModel } from '../../../types/project-edit-brief-plan'

type ProjectEditBriefPlanReadinessCardProps = {
  model: ProjectEditBriefPlanPanelModel
}

function readinessAccent(status: ProjectEditBriefPlanPanelModel['readinessStatus']) {
  if (status === 'ready_for_mock_plan_hints') return 'success'
  if (status === 'ready_with_warnings_mock') return 'warning'
  if (status === 'not_prepared') return 'muted'
  return 'danger'
}

export function ProjectEditBriefPlanReadinessCard({ model }: ProjectEditBriefPlanReadinessCardProps) {
  return (
    <div className="project-edit-brief-plan-readiness" data-testid="project-edit-brief-plan-readiness">
      <Badge accent={readinessAccent(model.readinessStatus)}>{model.readinessLabel}</Badge>
      <Badge>{model.eligibleMarkerCount} eligible</Badge>
      <Badge>{model.skippedMarkerCount} skipped</Badge>
      <Badge>{model.warningCount} warnings</Badge>
      <Badge>{model.blockedCount} blocked</Badge>
    </div>
  )
}
