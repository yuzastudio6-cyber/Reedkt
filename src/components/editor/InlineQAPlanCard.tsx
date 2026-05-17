import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan, QAStatus, SegmentQAPlanItem } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineQAPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusLabel(status: QAStatus) {
  return status.replaceAll('_', ' ')
}

function importantChecks(planChecks: SegmentQAPlanItem[]) {
  return planChecks
    .filter((check) => check.severity === 'blocking' || check.severity === 'high')
    .slice(0, 8)
}

export function InlineQAPlanCard({ descriptor, plan }: InlineQAPlanCardProps) {
  const qaPlan = plan.editQAPlan

  if (!qaPlan) {
    return null
  }

  const highlightedChecks = importantChecks([
    ...qaPlan.globalChecks,
    ...qaPlan.tierPolicyChecks,
    ...qaPlan.approvalChecks,
    ...qaPlan.segmentChecks,
  ])
  const editLevel = plan.compiledIntent?.resolvedSettings.editLevel
  const premium = editLevel === 'premium'
  const allChecks = [
    ...qaPlan.globalChecks,
    ...qaPlan.tierPolicyChecks,
    ...qaPlan.approvalChecks,
    ...qaPlan.segmentChecks,
  ]
  const warningOrBlockingCount = allChecks.filter((check) =>
    check.status === 'failed' ||
    check.status === 'blocked' ||
    check.status === 'warning' ||
    check.status === 'needs_user_review' ||
    check.severity === 'blocking' ||
    check.severity === 'high',
  ).length

  return (
    <InlinePlanCardShell
      className="qa-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{statusLabel(qaPlan.status)}</span>
          <span className="compact-summary-chip">{allChecks.length} checks</span>
          <span className="compact-summary-chip">{warningOrBlockingCount} high-priority</span>
          <span className="compact-summary-chip">{premium ? 'Premium final fallback only' : 'Basic/Pro no Veo'}</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Quality checks"
      helper="QA checks the edit against the user request, tier rules, source order, visual plan, frame layout, and professional standards before final delivery."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Quality checks"
    >
      <div className="qa-badge-row">
        <Badge accent={qaPlan.status === 'failed' ? 'danger' : 'success'}>{statusLabel(qaPlan.status)}</Badge>
      </div>

      <div className="qa-badge-row">
        <Badge accent={premium ? 'warning' : 'cyan'}>{premium ? 'Premium final fallback only' : 'Basic/Pro no Veo'}</Badge>
        <Badge accent="warning">Approval required</Badge>
        <Badge accent="blue">Matching panel background</Badge>
        <Badge accent="success">Captions safe</Badge>
        <Badge accent="muted">Professional standard</Badge>
      </div>

      <div className="qa-summary-grid">
        <span><strong>Global</strong>{qaPlan.globalChecks.length} checks</span>
        <span><strong>Segment</strong>{qaPlan.segmentChecks.length} checks</span>
        <span><strong>Tier policy</strong>{qaPlan.tierPolicyChecks.length} checks</span>
        <span><strong>Approval</strong>{qaPlan.approvalChecks.length} checks</span>
      </div>

      <p className="inline-helper">{qaPlan.summary}</p>

      <div className="qa-check-list">
        {highlightedChecks.map((check) => (
          <article className={`qa-check-item qa-severity-${check.severity}`} key={check.id}>
            <div>
              <strong>{check.label}</strong>
              <small>{formatLabel(check.category)} / {formatLabel(check.severity)} / {statusLabel(check.status)}</small>
            </div>
            <p>{check.check}</p>
            {check.fallbackActions.length > 0 && (
              <div className="segment-chip-row">
                {check.fallbackActions.slice(0, 3).map((fallback) => (
                  <span key={`${check.id}-${fallback.action}-${fallback.model ?? fallback.label}`}>
                    {fallback.label}
                    {fallback.model ? ` / ${fallback.model.replaceAll('_', ' ')}` : ''}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="renderer-notes">
        {qaPlan.notes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
