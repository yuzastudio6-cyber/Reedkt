import { Badge } from '../../Badge'
import { Card } from '../../Card'
import type { ProjectEditBriefWorkspaceModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefSummaryPanelProps = {
  model: ProjectEditBriefWorkspaceModel
}

export function ProjectEditBriefSummaryPanel({ model }: ProjectEditBriefSummaryPanelProps) {
  return (
    <Card className="project-edit-brief-summary-panel" data-testid="project-edit-brief-summary">
      <span className="section-eyebrow">Brief summary</span>
      <h3>{model.brief?.title ?? 'Optional Edit Brief'}</h3>
      <div className="project-edit-brief-summary-panel__badges">
        <Badge accent="cyan">{model.briefStatusLabel}</Badge>
        <Badge>{model.markerCountLabel}</Badge>
        <Badge>No planner execution</Badge>
      </div>
      <ul>
        {model.summaryLines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </Card>
  )
}
