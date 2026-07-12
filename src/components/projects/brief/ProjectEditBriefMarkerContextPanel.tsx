import type { PreferenceApplicationDownstreamContext } from '../../../types/edit-reference-integration'
import type { ProjectEditBriefVisualContext } from '../../../types/project-edit-brief-visual-context'
import { Badge } from '../../Badge'

type ProjectEditBriefMarkerContextPanelProps = {
  contextUsedByLastResponse?: boolean
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
  visualContext?: ProjectEditBriefVisualContext
}

export function ProjectEditBriefMarkerContextPanel({
  contextUsedByLastResponse = false,
  preferenceApplicationContext,
  visualContext,
}: ProjectEditBriefMarkerContextPanelProps) {
  const activeGuidanceCount = preferenceApplicationContext?.guidance.length ?? 0
  const heldBackGuidanceCount = preferenceApplicationContext?.heldBack.length ?? 0
  const boundaryCount = preferenceApplicationContext?.doNotCopyRules.length ?? 0
  const hasTargetAdaptation = Boolean(preferenceApplicationContext)

  return (
    <section className="project-edit-brief-marker-context" data-testid="project-edit-brief-marker-context-panel">
      <div className="project-edit-brief-marker-context__header">
        <div>
          <span className="section-eyebrow">Marker context</span>
          <h4>Current instruction order</h4>
        </div>
        <Badge accent={hasTargetAdaptation ? 'cyan' : undefined}>
          {hasTargetAdaptation ? 'Target adapted' : 'Target only'}
        </Badge>
      </div>
      <dl>
        <div>
          <dt>Visual evidence</dt>
          <dd>{visualContext ? visualContext.visualSummary : 'No marker-specific visual evidence is attached.'}</dd>
        </div>
        <div>
          <dt>Edit Reference</dt>
          <dd data-testid="project-edit-brief-marker-context-application">
            {preferenceApplicationContext
              ? `${activeGuidanceCount} target-adapted hint(s) active; ${heldBackGuidanceCount} held back for this edit.`
              : 'No target-adapted hint is connected to this marker.'}
          </dd>
        </div>
        <div>
          <dt>Safety boundaries</dt>
          <dd>{boundaryCount} do-not-copy rule(s) remain active.</dd>
        </div>
      </dl>
      <p data-testid="project-edit-brief-marker-context-used">
        {contextUsedByLastResponse
          ? 'The latest Marker Chat response used this validated target context.'
          : 'Marker Chat will receive this context only when the user sends a marker-scoped request.'}
      </p>
      <p className="project-edit-brief-muted">
        Confirmed target instructions and marker decisions outrank reusable guidance. This panel does not start a model, provider, worker, render, or credit action.
      </p>
    </section>
  )
}
