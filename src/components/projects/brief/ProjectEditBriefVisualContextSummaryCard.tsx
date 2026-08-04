import type { ProjectEditBriefVisualContext } from '../../../types/project-edit-brief-visual-context'

type ProjectEditBriefVisualContextSummaryCardProps = {
  context?: ProjectEditBriefVisualContext
}

function listText(values: string[]): string {
  return values.length ? values.join(', ') : 'None reported'
}

function runtimeLabel(context: ProjectEditBriefVisualContext): string {
  if (context.runtimeSource === 'visual_intelligence_authenticated_read') {
    return 'Visual Intelligence authenticated report'
  }
  if (context.runtimeSource === 'qwen25vl_live' || context.runtimeSource === 'qwen25vl_fake') {
    return 'Historical Qwen visual metadata — non-authoritative'
  }
  return context.runtimeSource.replace(/_/g, ' ')
}

export function ProjectEditBriefVisualContextSummaryCard({
  context,
}: ProjectEditBriefVisualContextSummaryCardProps) {
  if (!context) {
    return (
      <div className="project-edit-brief-visual-context-summary" data-testid="project-edit-brief-visual-context-summary">
        <p>Visual context unavailable.</p>
      </div>
    )
  }

  return (
    <div className="project-edit-brief-visual-context-summary" data-testid="project-edit-brief-visual-context-summary">
      <div className="project-edit-brief-visual-context-summary__headline">
        <strong>{runtimeLabel(context)}</strong>
        <span>{context.confidence} confidence</span>
      </div>
      <p>{context.visualSummary}</p>
      <dl className="project-edit-brief-visual-context-grid">
        <div>
          <dt>Setting</dt>
          <dd>{context.setting}</dd>
        </div>
        <div>
          <dt>Objects</dt>
          <dd>{listText(context.visibleObjects)}</dd>
        </div>
        <div>
          <dt>People</dt>
          <dd>{listText(context.visiblePeople)}</dd>
        </div>
        <div>
          <dt>Actions</dt>
          <dd>{listText(context.actions)}</dd>
        </div>
        <div>
          <dt>Camera</dt>
          <dd>{context.cameraMotion}</dd>
        </div>
        <div>
          <dt>Visible text</dt>
          <dd>{listText(context.visibleText)}</dd>
        </div>
      </dl>
      <div className="project-edit-brief-visual-context-lists">
        <p><strong>B-roll:</strong> {listText(context.brollOpportunities)}</p>
        <p><strong>Risks:</strong> {listText(context.visualRisks)}</p>
        <p><strong>Do not copy:</strong> {listText(context.doNotCopyNotes)}</p>
      </div>
      <p className="project-edit-brief-muted">
        {context.timeRange.label}. Current evidence is accepted only from the immutable authenticated report reread.
      </p>
    </div>
  )
}
