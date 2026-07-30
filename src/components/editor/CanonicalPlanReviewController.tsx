import type { ReactNode } from 'react'

import type { CanonicalPlanApprovalHookResult } from '../../hooks/useCanonicalPlanApproval'
import { Button } from '../Button'
import { CanonicalPlanApprovalStatus } from './CanonicalPlanApprovalStatus'
import {
  CanonicalPlanningSaveStatus,
  type CanonicalPlanningSaveStatusSource,
} from './CanonicalPlanningSaveStatus'
import {
  PlanReviewApprovalCard,
  type PlanReviewApprovalCardProps,
} from './PlanReviewApprovalCard'

type CanonicalPlanReviewControllerProps = Omit<
  PlanReviewApprovalCardProps,
  'approvalAuthorityStatus' | 'approvalPending'
> & {
  approvalChecking?: boolean
  planApproval?: CanonicalPlanApprovalHookResult
  planningPublication?: CanonicalPlanningSaveStatusSource
  statusSupplement?: ReactNode
}

/**
 * The shared presentation boundary for the one canonical Plan Review.
 *
 * Normal Edit Chat and Storytelling Director can own different conversations
 * while consuming the same save, approval, estimate, and immutable-plan UI.
 * This component does not create another plan or approval authority.
 */
export function CanonicalPlanReviewController({
  approvalChecking = false,
  planApproval,
  planningPublication,
  statusSupplement,
  ...card
}: CanonicalPlanReviewControllerProps) {
  const canonicalPlanPublished =
    planningPublication?.result?.status ===
    'plan_published_waiting_for_approval'
  if (planningPublication && !canonicalPlanPublished) {
    return (
      <section
        className="clean-edit-step clean-plan-review"
        data-testid="canonical-plan-publication-blocker"
      >
        <div className="clean-plan-checkpoint">
          <header className="clean-edit-step-header">
            <div>
              <span className="clean-edit-step-count">Plan verification</span>
              <h2>The executable plan is not ready yet</h2>
              <p>
                ReeditPro will show an estimate and approval button only after
                the private backend publishes the exact plan it can execute.
              </p>
            </div>
          </header>
          <CanonicalPlanningSaveStatus {...planningPublication} />
          {statusSupplement}
          {card.onReviseSetup ? (
            <div className="clean-edit-step-actions">
              <Button onClick={card.onReviseSetup} variant="secondary">
                Revise setup
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  const authorityStatus = planningPublication || planApproval || statusSupplement ? (
    <>
      {planningPublication ? <CanonicalPlanningSaveStatus {...planningPublication} /> : null}
      {planApproval ? (
        <CanonicalPlanApprovalStatus
          approving={planApproval.approving}
          result={planApproval.result}
        />
      ) : null}
      {statusSupplement}
    </>
  ) : undefined

  return (
    <PlanReviewApprovalCard
      {...card}
      approvalAuthorityStatus={authorityStatus}
      approvalPending={approvalChecking || planApproval?.approving === true}
    />
  )
}
