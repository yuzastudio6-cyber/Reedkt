import type { ReactNode } from 'react'

import type { CanonicalPlanApprovalHookResult } from '../../hooks/useCanonicalPlanApproval'
import type { CanonicalPlanningPublicationHookResult } from '../../hooks/useCanonicalPlanningPublication'
import { CanonicalPlanApprovalStatus } from './CanonicalPlanApprovalStatus'
import { CanonicalPlanningSaveStatus } from './CanonicalPlanningSaveStatus'
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
  planningPublication?: CanonicalPlanningPublicationHookResult
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
