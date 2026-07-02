import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditOperationPlan, EditPlan, SegmentEditPlan } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineSegmentEditPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function formatTimeRange(segment: SegmentEditPlan) {
  return `${segment.finalTimeRange.startSeconds.toFixed(0)}-${segment.finalTimeRange.endSeconds.toFixed(0)}s`
}

function operationSummary(operation: EditOperationPlan) {
  return `${formatLabel(operation.operationType)} / ${operation.status.replaceAll('_', ' ')}`
}

export function InlineSegmentEditPlanCard({ descriptor, plan }: InlineSegmentEditPlanCardProps) {
  const segmentPlans = plan.segmentEditPlans ?? []

  if (segmentPlans.length === 0) {
    return null
  }

  const operationCount = segmentPlans.reduce((total, segment) => total + segment.operations.length, 0)
  const directive = plan.professionalEditingDirective

  return (
    <InlinePlanCardShell
      className="segment-edit-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{segmentPlans.length} segments</span>
          <span className="compact-summary-chip">{operationCount} operations</span>
          {directive && <span className="compact-summary-chip">{formatLabel(directive.editStyle)}</span>}
          {directive && <span className="compact-summary-chip">{formatLabel(directive.colorGradeStyle)}</span>}
          {directive && <span className="compact-summary-chip">{formatLabel(directive.captionStyle)}</span>}
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Segment operations"
      helper="This is how ReeditPro turns the chat request into worker-ready editing instructions. Each segment includes cuts, captions, color, b-roll, sound, transitions, visuals, and QA."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Segment edit operations"
    >
      <div className="qa-badge-row">
        <Badge accent="cyan">Mock worker instructions</Badge>
        <Badge accent="muted">Production workers execute approved versions later</Badge>
      </div>
      <div className="segment-plan-list">
        {segmentPlans.map((segment) => {
          const visibleOperations = segment.operations.slice(0, 4)
          const hiddenOperationCount = Math.max(0, segment.operations.length - visibleOperations.length)

          return (
            <article className="segment-plan-item" key={segment.id}>
              <div className="segment-plan-header">
                <div>
                  <span className="section-eyebrow">Segment {segment.segmentOrder} / {formatLabel(segment.role)}</span>
                  <h4>{segment.label}</h4>
                  <p>{segment.storyPurpose}</p>
                </div>
                <Badge accent="muted">{formatTimeRange(segment)}</Badge>
              </div>

              <div className="segment-plan-meta">
                <span><strong>Pacing</strong>{formatLabel(segment.pacingStyle)}</span>
                <span><strong>Cut intensity</strong>{formatLabel(segment.cutIntensity)}</span>
                <span><strong>Color</strong>{formatLabel(segment.colorGradePlan.style)}</span>
                <span><strong>Captions</strong>{formatLabel(segment.captionPlan.style)}</span>
                <span><strong>B-roll</strong>{formatLabel(segment.brollPlan.policy)}</span>
                <span><strong>Sound</strong>{formatLabel(segment.soundPlan.style)}</span>
              </div>

              <div className="segment-chip-row">
                <span>{segment.sourceClipIds.length} source clip{segment.sourceClipIds.length === 1 ? '' : 's'}</span>
                <span>{segment.visualAssetPlanItemIds.length} visual asset{segment.visualAssetPlanItemIds.length === 1 ? '' : 's'}</span>
                <span>{segment.operations.length} operation{segment.operations.length === 1 ? '' : 's'}</span>
                <span>{segment.qaPlan.length} QA check{segment.qaPlan.length === 1 ? '' : 's'}</span>
                <span>{segment.transitionPlan.families.map(formatLabel).join(', ')}</span>
              </div>

              <div className="segment-operation-list">
                {visibleOperations.map((operation) => (
                  <div className="segment-operation-item" key={operation.id}>
                    <div>
                      <strong>{operation.label}</strong>
                      <small>{operationSummary(operation)}</small>
                    </div>
                    <p>{operation.instruction}</p>
                    <small>{operation.reason}</small>
                  </div>
                ))}
                {hiddenOperationCount > 0 && (
                  <div className="segment-operation-item segment-operation-more">
                    + {hiddenOperationCount} more planned operation{hiddenOperationCount === 1 ? '' : 's'}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </InlinePlanCardShell>
  )
}
