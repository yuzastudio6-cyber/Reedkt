import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  TimingValidationCheck,
  TimingValidationStatus,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineTimingValidationCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function statusAccent(status: TimingValidationStatus) {
  if (status === 'blocking' || status === 'failed') return 'danger'
  if (status === 'warning') return 'warning'
  return 'success'
}

function checksByStatus(checks: TimingValidationCheck[], status: TimingValidationStatus) {
  return checks.filter((check) => check.status === status)
}

function statusLabel(status: TimingValidationStatus) {
  return status.replaceAll('_', ' ')
}

function CheckList({ checks, title }: { checks: TimingValidationCheck[]; title: string }) {
  if (!checks.length) {
    return null
  }

  return (
    <div>
      <h4>{title}</h4>
      <div className="timing-validation-check-list">
        {checks.slice(0, 8).map((check) => (
          <article className={`timing-validation-check-item timing-validation-check-${check.status}`} key={check.id}>
            <div className="compact-summary-row">
              <strong>{check.label}</strong>
              <span className="timing-validation-status-badge">{statusLabel(check.status)}</span>
            </div>
            <span>{check.category.replaceAll('_', ' ')}</span>
            <small>{check.message}</small>
            {check.recommendation && <em>{check.recommendation}</em>}
            {check.relatedCueIds.length > 0 && <small>Related: {check.relatedCueIds.slice(0, 4).join(', ')}</small>}
          </article>
        ))}
      </div>
    </div>
  )
}

export function InlineTimingValidationCard({ descriptor, plan }: InlineTimingValidationCardProps) {
  const timingValidationPlan = plan.timingValidationPlan

  if (!timingValidationPlan) {
    return null
  }

  const blockingChecks = checksByStatus(timingValidationPlan.globalChecks, 'blocking')
  const failedChecks = checksByStatus(timingValidationPlan.globalChecks, 'failed')
  const warningChecks = checksByStatus(timingValidationPlan.globalChecks, 'warning')
  const passedChecks = checksByStatus(timingValidationPlan.globalChecks, 'passed')
  const shouldExpand = descriptor?.defaultExpanded ?? (timingValidationPlan.approvalBlocked || timingValidationPlan.overallStatus === 'failed')

  return (
    <InlinePlanCardShell
      className="timing-validation-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{statusLabel(timingValidationPlan.overallStatus)}</span>
          <span className="compact-summary-chip">{timingValidationPlan.approvalBlocked ? 'approval locked' : 'approval ready'}</span>
          <span className="compact-summary-chip">{timingValidationPlan.totalEstimatedTimingCredits} timing credits</span>
          <span className="compact-summary-chip">{timingValidationPlan.lowerCostRecommendations.length} tradeoffs</span>
        </div>
      )}
      defaultExpanded={shouldExpand}
      eyebrow="Approval QA"
      helper="ReeditPro validates frame-accurate captions, visuals, transitions, SFX, ducking, AI clip placement, and Remotion layer timing before approval."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Timing validation"
    >
      <div className="renderer-badge-row">
        <Badge accent={statusAccent(timingValidationPlan.overallStatus)}>{statusLabel(timingValidationPlan.overallStatus)}</Badge>
        <Badge accent={timingValidationPlan.approvalBlocked ? 'danger' : 'success'}>{timingValidationPlan.approvalBlocked ? 'Approval locked' : 'Approval gate clear'}</Badge>
        <Badge accent="cyan">Frame confirmed</Badge>
        <Badge accent="blue">Caption readable</Badge>
        <Badge accent="violet">Timing credits</Badge>
        <Badge accent="muted">Mock validation</Badge>
      </div>

      <div className="timing-validation-summary-grid">
        <span><strong>Active</strong>{timingValidationPlan.active ? 'yes' : 'no'}</span>
        <span><strong>Status</strong>{statusLabel(timingValidationPlan.overallStatus)}</span>
        <span><strong>Approval blocked</strong>{timingValidationPlan.approvalBlocked ? 'yes' : 'no'}</span>
        <span><strong>Timing credits</strong>{timingValidationPlan.totalEstimatedTimingCredits}</span>
        <span><strong>Profiles</strong>{timingValidationPlan.creditProfilesUsed.join(', ') || 'none'}</span>
        <span><strong>Tradeoffs</strong>{timingValidationPlan.lowerCostRecommendations.length}</span>
      </div>

      {timingValidationPlan.approvalBlocked && (
        <div className="timing-approval-blocked-note">
          <strong>Approval gate</strong>
          {timingValidationPlan.approvalBlockReasons.slice(0, 5).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}

      <CheckList checks={blockingChecks} title="Blocking checks" />
      <CheckList checks={failedChecks} title="Failed checks" />
      <CheckList checks={warningChecks} title="Warnings" />
      <CheckList checks={passedChecks.slice(0, 6)} title="Passed checks" />

      <div>
        <h4>Timing validation items</h4>
        <div className="timing-validation-item-list">
          {timingValidationPlan.items.map((item) => (
            <article className="timing-validation-item" key={item.id}>
              <div className="compact-summary-row">
                <strong>{item.label}</strong>
                <span className="timing-credit-profile-badge">{item.complexity}</span>
                <span className="timing-credit-impact-badge">{item.creditImpact}</span>
              </div>
              <span>{item.estimatedPlanningCredits} estimated timing credit(s)</span>
              <small>{item.userFacingSummary}</small>
              {item.developerNotes.slice(0, 2).map((note) => <small key={note}>{note}</small>)}
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4>Lower-cost alternatives</h4>
        <div className="timing-lower-cost-list">
          {timingValidationPlan.lowerCostRecommendations.length ? timingValidationPlan.lowerCostRecommendations.map((recommendation) => (
            <article className="timing-lower-cost-item" key={recommendation.id}>
              <strong>{recommendation.label}</strong>
              <span>Save about {recommendation.estimatedCreditSavings} credits</span>
              <small>{recommendation.tradeoff}</small>
              <small>{recommendation.whatChanges.join('; ')}</small>
              <em>{recommendation.keepsProfessionalQuality ? 'Keeps professional quality' : 'Quality tradeoff'} / {recommendation.requiresNewApproval ? 'needs new approval' : 'no new approval'}</em>
            </article>
          )) : (
            <article className="timing-lower-cost-item">
              <strong>No timing simplification needed</strong>
              <span>Current timing complexity is already simple or reviewable.</span>
            </article>
          )}
        </div>
      </div>

      <div>
        <h4>QA</h4>
        <div className="timing-validation-check-list">
          {timingValidationPlan.qaChecks.map((qaCheck) => (
            <article className="timing-validation-check-item" key={qaCheck}>
              <strong>{qaCheck}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="timing-validation-mock-note">
        {timingValidationPlan.limitations.map((limitation) => (
          <span key={limitation}>{limitation}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
