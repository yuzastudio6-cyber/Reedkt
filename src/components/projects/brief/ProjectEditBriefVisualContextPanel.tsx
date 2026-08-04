import { Badge } from '../../Badge'
import {
  createProjectEditBriefVisualContextSummary,
  isCurrentProjectEditBriefVisualContext,
  isHistoricalProjectEditBriefVisualContext,
  readProjectEditBriefVisualContextFromMarker,
} from '../../../lib/project-edit-brief-visual-context-ui-adapter'
import type { ProjectEditBriefMarkerRecord } from '../../../types/project-edit-brief'
import { ProjectEditBriefVisualContextBoundaryNotice } from './ProjectEditBriefVisualContextBoundaryNotice'
import { ProjectEditBriefVisualContextSummaryCard } from './ProjectEditBriefVisualContextSummaryCard'

type ProjectEditBriefVisualContextPanelProps = {
  marker: ProjectEditBriefMarkerRecord
}

export function ProjectEditBriefVisualContextPanel({
  marker,
}: ProjectEditBriefVisualContextPanelProps) {
  const context = readProjectEditBriefVisualContextFromMarker(marker)
  const current = isCurrentProjectEditBriefVisualContext(context)
  const historical = isHistoricalProjectEditBriefVisualContext(context)

  return (
    <section className="project-edit-brief-visual-context" data-testid="project-edit-brief-visual-context-panel">
      <div className="project-edit-brief-visual-context__header">
        <div>
          <h4>Visual Intelligence</h4>
          <p>
            {current
              ? 'This marker is backed by an authenticated immutable Visual Intelligence report.'
              : 'Visual analysis runs through Head Intelligence and Orchestra against canonical source media.'}
          </p>
        </div>
        <Badge accent={current ? 'cyan' : undefined}>
          {current ? 'Authenticated report' : historical ? 'Historical only' : 'Awaiting Orchestra'}
        </Badge>
      </div>
      <ProjectEditBriefVisualContextBoundaryNotice />
      <div className="project-edit-brief-visual-context__status" data-testid="project-edit-brief-visual-context-status" role="status">
        {createProjectEditBriefVisualContextSummary(context)}
      </div>
      <ProjectEditBriefVisualContextSummaryCard context={context} />
    </section>
  )
}
