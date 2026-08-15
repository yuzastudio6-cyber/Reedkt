import type { CanonicalEditJourney } from './canonical-edit-journey'

export type CanonicalPresentedPlanIdentity = {
  planId: string
  planVersion: number
  planHash: string
}

/**
 * Restores the exact presented-plan identity from the read-only canonical
 * journey after a browser reload. The approval authority already binds the
 * plan ID and hash, while the plan summary binds the current version and
 * presented estimate state. No new publication or approval is created.
 */
export function recoverCanonicalPresentedPlanIdentity(
  journey?: CanonicalEditJourney,
): CanonicalPresentedPlanIdentity | undefined {
  const authority = journey?.approvalAuthority
  const plan = journey?.plan
  if (
    journey?.stage !== 'plan_approval_required' ||
    !authority ||
    !plan ||
    plan.status !== 'presented' ||
    plan.estimateStatus !== 'presented'
  ) {
    return undefined
  }

  return {
    planId: authority.planId,
    planVersion: plan.version,
    planHash: authority.expectedPlanHash,
  }
}

export function canonicalPlanApprovalReadyForPresentedPlan(input: {
  backendConnected: boolean
  journey?: CanonicalEditJourney
  publicationStatus?: string
  presentedPlan?: CanonicalPresentedPlanIdentity
  visibleMaximumCredits: number
}): boolean {
  if (!input.backendConnected) return true

  const journey = input.journey
  const authority = journey?.approvalAuthority
  const presentedPlan = input.presentedPlan
  return Boolean(
    journey?.stage === 'plan_approval_required' &&
    authority &&
    journey.plan?.status === 'presented' &&
    journey.plan.estimateStatus === 'presented' &&
    journey.plan.maximumCredits === input.visibleMaximumCredits &&
    input.publicationStatus === 'plan_published_waiting_for_approval' &&
    presentedPlan?.planId === authority.planId &&
    presentedPlan.planVersion === journey.plan.version &&
    presentedPlan.planHash === authority.expectedPlanHash,
  )
}
