import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan, FactClaimStatus, FactSafetyPlanItem } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineDocumentaryFactSafetyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const claimStatusAccent: Record<FactClaimStatus, 'blue' | 'cyan' | 'violet' | 'warning' | 'danger' | 'success' | 'muted'> = {
  allegation: 'warning',
  charge: 'warning',
  claim_by_source: 'blue',
  fictional: 'violet',
  opinion: 'muted',
  unknown: 'danger',
  verified_fact: 'success',
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function sourceBadge(item: FactSafetyPlanItem) {
  if (item.sourceNeeded) {
    return <span className="source-needed-badge">Source needed</span>
  }

  return <span className="neutral-treatment-badge">Source status planned</span>
}

export function InlineDocumentaryFactSafetyCard({ descriptor, plan }: InlineDocumentaryFactSafetyCardProps) {
  const factSafetyPlan = plan.documentaryFactSafetyPlan

  if (!factSafetyPlan?.active) {
    return null
  }

  const sourceNeededCount = factSafetyPlan.claimItems.filter((item) => item.sourceNeeded).length
  const uncertainCount = factSafetyPlan.claimItems.filter((item) =>
    item.claimStatus === 'unknown' ||
    item.claimStatus === 'allegation' ||
    item.claimStatus === 'charge' ||
    item.claimStatus === 'claim_by_source',
  ).length

  return (
    <InlinePlanCardShell
      className="fact-safety-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">Active</span>
          <span className="compact-summary-chip">{factSafetyPlan.claimItems.length} claims</span>
          <span className="compact-summary-chip">{sourceNeededCount} source-needed</span>
          <span className="compact-summary-chip">{uncertainCount} cautious</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Fact safety"
      helper="For documentary and case-study edits, ReeditPro keeps claims, names, money amounts, and allegations visually neutral unless verified."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Fact safety"
    >
      <div className="qa-badge-row">
        <Badge accent="warning">Neutral claim treatment</Badge>
        <Badge accent="muted">No real fact verification</Badge>
      </div>
      {factSafetyPlan.clarifyingQuestions.length > 0 && (
        <p className="fact-safety-warning">
          {factSafetyPlan.clarifyingQuestions[0].question}
        </p>
      )}

      <div className="fact-claim-list">
        {factSafetyPlan.claimItems.slice(0, 4).map((item) => (
          <article className="fact-claim-item" key={item.id}>
            <div className="segment-plan-header">
              <div>
                <strong>{item.claimText}</strong>
                <small>{item.safeWording}</small>
              </div>
              <div className="fact-claim-meta">
                <Badge accent={claimStatusAccent[item.claimStatus]}>{formatLabel(item.claimStatus)}</Badge>
                {sourceBadge(item)}
              </div>
            </div>

            <div className="qa-summary-grid">
              <span><strong>People</strong>{item.peopleMentioned.length > 0 ? item.peopleMentioned.join(', ') : 'none'}</span>
              <span><strong>Organizations</strong>{item.organizationsMentioned.length > 0 ? item.organizationsMentioned.join(', ') : 'none'}</span>
              <span><strong>Treatment</strong>{formatLabel(item.visualTreatment)}</span>
              <span><strong>Severity</strong>{formatLabel(item.severity)}</span>
            </div>

            <div className="intent-rule-list">
              {item.avoidRules.slice(0, 3).map((rule) => (
                <span className="intent-rule-item" key={rule}>{rule}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {factSafetyPlan.claimItems.length > 4 && <p className="inline-helper">+ {factSafetyPlan.claimItems.length - 4} more fact-safety item{factSafetyPlan.claimItems.length - 4 === 1 ? '' : 's'} included in the mock plan.</p>}

      <div className="renderer-notes">
        {factSafetyPlan.globalRules.slice(0, 4).map((rule) => (
          <span key={rule}>{rule}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
