import { GitMerge, ShieldCheck } from 'lucide-react'
import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
import { createProjectEditBriefPreferenceApplicationSummary } from '../../../lib/project-edit-brief-preference-application-ui-adapter'
import { Badge } from '../../Badge'
import { Card } from '../../Card'

export function ProjectEditBriefPreferenceApplicationCard({
  context,
}: {
  context: PreferenceApplicationDownstreamContext
}) {
  const model = createProjectEditBriefPreferenceApplicationSummary(context)
  return (
    <Card className="project-edit-brief-preference-application" data-testid="project-edit-brief-preference-application">
      <div className="project-edit-brief-preference-application__header">
        <div>
          <span className="section-eyebrow">Applied Edit Reference</span>
          <h3>{model.title}</h3>
        </div>
        <Badge accent="violet">{model.statusLabel}</Badge>
      </div>
      <p>{model.summary}</p>
      <div className="project-edit-brief-preference-application__metrics">
        <span><GitMerge aria-hidden="true" size={14} />{model.activeGuidanceCount} adapted hints</span>
        <span><ShieldCheck aria-hidden="true" size={14} />{model.heldBackCount} held back</span>
        <span>{model.doNotCopyCount} boundaries</span>
      </div>
      <p className="project-edit-brief-preference-application__priority">{model.prioritySummary}</p>
      <p className="project-edit-brief-preference-application__boundary">{model.boundarySummary}</p>
    </Card>
  )
}
