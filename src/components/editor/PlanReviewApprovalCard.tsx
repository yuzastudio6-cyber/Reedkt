import type { ReactNode } from 'react'
import { Button } from '../Button'
import type { EditPlan, SignatureSystem } from '../../types/reeditpro'

type PlanReviewApprovalCardProps = {
  approved: boolean
  approvalAuthorityBlockedLabel?: string
  approvalAuthorityReady?: boolean
  approvalAuthorityStatus?: ReactNode
  approvalPending?: boolean
  planningContextBlockedReason?: string
  planningContextReady?: boolean
  onApprove: () => void
  onAskQuestion: () => void
  onLowerCost: () => void
  onRemoveRealMotion: () => void
  onReviseSetup?: () => void
  plan: EditPlan
}

const treatmentLabels: Record<SignatureSystem, string> = {
  graphic_design: 'Visual explanation',
  none: 'Clean source edit',
  real_motion: 'Premium motion',
  sound_sync: 'Sound design',
  stroke_motion: 'Story animation',
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function uniqueSystems(plan: EditPlan): SignatureSystem[] {
  const systems = new Set<SignatureSystem>()
  plan.signatureRoutes.forEach((route) => {
    if (route.system !== 'none') systems.add(route.system)
  })
  if (plan.soundSyncDirection) systems.add('sound_sync')
  return systems.size > 0 ? Array.from(systems) : ['none']
}

export function PlanReviewApprovalCard({
  approved,
  approvalAuthorityBlockedLabel = 'Waiting for saved plan',
  approvalAuthorityReady = true,
  approvalAuthorityStatus,
  approvalPending = false,
  planningContextBlockedReason,
  planningContextReady = true,
  onApprove,
  onAskQuestion,
  onLowerCost,
  onRemoveRealMotion,
  onReviseSetup,
  plan,
}: PlanReviewApprovalCardProps) {
  const estimate = plan.creditEstimate
  const frameConfirmed = plan.aspectRatioFramePlan?.status === 'confirmed'
  const approvalDisabled = approved || approvalPending || !approvalAuthorityReady || !frameConfirmed || !planningContextReady || estimate.approvalBlocked
  const systems = uniqueSystems(plan)
  const timingBlocked = Boolean(plan.timingValidationPlan?.approvalBlocked)

  return (
    <section className="clean-edit-step clean-plan-review" data-testid="plan-review-card">
      <div className="clean-plan-checkpoint" data-testid="plan-approval-checkpoint">
      <header className="clean-edit-step-header">
        <div>
          <span className="clean-edit-step-count">Plan review</span>
          <h2>{approved ? 'Plan approved' : 'Review the edit direction'}</h2>
          <p>One approval covers this exact direction and estimate. Any material change creates a fresh plan.</p>
        </div>
        <div className="clean-plan-estimate">
          <strong>{estimate.total}</strong>
          <span>estimated credits</span>
        </div>
      </header>

      <div className="clean-plan-intent" data-testid="plan-review-approval-summary">
        <span>What I understood</span>
        <strong>{plan.goalSummary}</strong>
      </div>

      <dl className="clean-plan-facts">
        <div>
          <dt>Opening</dt>
          <dd>{plan.hookDecision.recommendation}</dd>
        </div>
        <div>
          <dt>Edit style</dt>
          <dd>{plan.professionalEditingDirective ? formatLabel(plan.professionalEditingDirective.editStyle) : 'Professional clean edit'}</dd>
        </div>
        <div>
          <dt>Output frame</dt>
          <dd>{plan.aspectRatioFramePlan?.selectedAspectRatio ?? plan.aspectRatioFramePlan?.recommendedAspectRatio?.recommendedAspectRatio ?? 'Needs confirmation'}</dd>
        </div>
        <div>
          <dt>Timing</dt>
          <dd>{timingBlocked ? 'Needs attention' : 'Speech-first and validated'}</dd>
        </div>
      </dl>

      <section className="clean-plan-section">
        <h3>Story structure</h3>
        <ol>
          {plan.recommendedStructure.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="clean-plan-section">
        <h3>Planned treatments</h3>
        <div className="clean-plan-treatments" data-testid="plan-review-decision-summary">
          {systems.map((system) => <span key={system}>{treatmentLabels[system]}</span>)}
        </div>
        <p>
          {plan.professionalSkillPlan?.selectedSkillCount
            ? `${plan.professionalSkillPlan.selectedSkillCount} approved editing activities are included behind the plan gate.`
            : 'Treatments stay restrained and follow the source and story.'}
        </p>
      </section>

      <div className="clean-plan-credit-note">
        <strong>{estimate.total} Reedit Credits</strong>
        <span>Credits are used only after you approve this estimate. No unapproved extra work is charged later.</span>
      </div>

      {!frameConfirmed ? <p className="clean-edit-inline-warning">Confirm the output frame before approval.</p> : null}
      {!planningContextReady ? (
        <p className="clean-edit-inline-warning">{planningContextBlockedReason || 'Resolve the planning blocker before approval.'}</p>
      ) : null}
      {estimate.approvalBlocked && estimate.draftReason ? <p className="clean-edit-inline-warning">{estimate.draftReason}</p> : null}
      {timingBlocked ? (
        <p className="clean-edit-inline-warning">{plan.timingValidationPlan?.approvalBlockReasons[0] ?? 'Timing must be resolved before approval.'}</p>
      ) : null}

      {approvalAuthorityStatus}

      <div className="clean-edit-step-actions clean-plan-actions">
        <Button
          aria-busy={approvalPending}
          data-testid="plan-review-approve"
          disabled={approvalDisabled}
          onClick={onApprove}
          variant="primary"
        >
          {approved
            ? 'Plan approved'
            : approvalPending
              ? 'Approving plan…'
              : !approvalAuthorityReady
                ? approvalAuthorityBlockedLabel
                : approvalDisabled
                  ? 'Resolve setup first'
                  : 'Approve plan'}
        </Button>
        {onReviseSetup ? <Button disabled={approved} onClick={onReviseSetup} variant="secondary">Revise setup</Button> : null}
        <Button disabled={approved} onClick={onLowerCost} variant="secondary">Lower cost</Button>
        <Button disabled={approved} onClick={onRemoveRealMotion} variant="ghost">Simplify motion</Button>
        <Button disabled={approved} onClick={onAskQuestion} variant="ghost">Ask a question</Button>
      </div>
      </div>
    </section>
  )
}
